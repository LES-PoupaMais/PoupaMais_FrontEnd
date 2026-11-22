# Testes e pipeline

> Detalhe do guia (antes no `CLAUDE.md`). A definição de pronto fica no `AGENTS.md`.

## Testes

Guia detalhado: skill `testes-frontend`.

| Nível | Onde | Ferramentas | O que prova |
|---|---|---|---|
| **Unitário** | ao lado do arquivo (`format.test.ts`, `lancamento.schema.test.ts`) | Vitest | Formatação, datas, schemas Zod, utilitários, services |
| **Componente** | ao lado do componente (`money-text.test.tsx`) | Vitest + Testing Library + `user-event` | O que o usuário vê e faz **por props**; acessibilidade básica |
| **Hooks globais** | `hooks/*.test.tsx` | `renderHook` + `criarWrapper()` + MSW | Paginação, invalidação após mutations |
| **Integração da tela** | `screens/<Tela>/<Tela>View.test.tsx` | Provider + View + **MSW** (`renderComProviders`) | Carregando, vazio, erro, sucesso, ações e toasts |
| **End-to-end** | `e2e/*.spec.ts` | **Playwright** (Chromium e Firefox) | Fluxos completos sobre o build de produção |

- **E2E sem backend (`npm run test:e2e`):** sessão pelo cookie `pm_token` (o `proxy.ts` só confere a presença) e API simulada no navegador com
  `page.route('**/api/**')` (`e2e/fixtures/`). Cobrir o roteiro da demo.
- **E2E contra a API real (`npm run test:e2e:api-real`, `e2e/api-real/` + `playwright.api-real.config.ts`):** o roteiro da demo
  inteiro com Spring, Postgres e Mailpit de verdade, só no Chromium (Firefox: `--project=firefox`). Roda também no CI (job
  `api-real`, ver Pipeline).
  - Subir a pilha: `cd ../PoupaMais_Development && E2E_FRONT_PORT=3130 npm run e2e:up` (API `127.0.0.1:8580`, Mailpit `8525`,
    banco `5435`, projeto docker `poupamais-e2e`); derrubar com `npm run e2e:down`. Não mexe na pilha dev (`poupamais`).
  - O config sobe `next build && next start` em `PORT` (padrão **3130**) com `API_URL=http://localhost:8580` (build de produção,
    como a outra suíte: sem a compilação sob demanda do `next dev`). Um `globalSetup` (`apoio/conferir-pilha.ts`) para a suíte
    com a instrução certa se a API ou o Mailpit não responderem.
  - Cada teste ganha um **usuário novo** (fixtures `usuario` e `logado` de `apoio/teste.ts`; e-mail único) e monta os dados pela
    API (`apoio/api.ts`); nada depende de ordem nem de banco limpo. Lembre que o cadastro já cria as 11 categorias padrão
    (`categoria()` reaproveita a existente). Datas fixas em outubro de 2026 (`MES`/`ANO`), sem depender do relógio.
  - O "esqueci a senha" lê o link pela API HTTP do Mailpit (`apoio/mailpit.ts`) e abre só o caminho `/redefinir-senha?token=…`
    no Next do teste (o domínio do link vem do `FRONT_URL` da pilha).
  - Prazos maiores (passo 20 s, teste 90 s): cada passo vai até a API e o banco. Com a máquina muito carregada (várias worktrees
    rodando testes ao mesmo tempo), o navegador pode travar; rode de novo com a máquina livre antes de culpar o código.
- **Largura nos testes:** o jsdom não tem `matchMedia`; `src/test/media.ts` instala um falso (cada teste começa em 390px) e
  `simularLargura(1280)` muda. No E2E, `page.setViewportSize`.
- **Cobertura (Vitest v8):** `npm run test:coverage` falha abaixo de **80% de linhas, funções e statements e 70% de branches**.
  Fora da conta: átomos do shadcn **sem lógica nossa** (lista no `vitest.config.mts`), `app/**` (só rotas, cobertas pelo E2E), `styles/**`,
  `**/index.ts`, `src/test/**`, `proxy.ts` e `.d.ts`. `screens/**` entra.

## Pipeline (CI: GitHub Actions)

Arquivo: `.github/workflows/ci.yml`. Roda em push na `development` e na `main` e em todo PR; um push novo no mesmo PR cancela o anterior.

| Job | Passos | Reprova se |
|---|---|---|
| `qualidade` (Lint, tipos, testes e build) | `npm ci` · `lint` · `format:check` · `typecheck` · `test:coverage` · `build` · publica `coverage/` | erro de lint/arquitetura, formatação, tipo, teste, cobertura abaixo do piso ou build quebrado |
| `e2e` (Testes end-to-end), depois de `qualidade` | `npm ci` · `npx playwright install --with-deps chromium firefox` · `npm run test:e2e` · publica `playwright-report/` se falhar | qualquer fluxo E2E quebrado |
| `api-real` (Testes contra a API real), depois de `qualidade` | checkout deste repo, do `PoupaMais_BackEnd` e do `PoupaMais_Development` (branch `development` dos dois) em pastas irmãs · `npm run e2e:up` no Development (constrói a API e sobe a pilha E2E) · `npm ci` · `npx playwright install --with-deps chromium` · `npm run test:e2e:api-real` · logs da API e `playwright-report-api-real/` se falhar · `npm run e2e:down` | qualquer passo do roteiro da demo contra a API real quebrado (ou a API da `development` do back não subir) |

- O job `api-real` usa a `development` do back e do Development: uma mudança de contrato no back que quebre o front aparece
  aqui. Localmente: seção "Testes" (`npm run e2e:up` no PoupaMais_Development e `npm run test:e2e:api-real`).
- Rodar o mesmo localmente: skill `pipeline-local`. O Vitest usa metade dos núcleos (`maxWorkers: '50%'` no `vitest.config.mts`;
  com todos, testes de tela passavam do timeout de 5 s com a máquina ocupada). Localmente o Playwright usa 3 workers (com mais, o Firefox estoura o tempo no WSL).
  Com várias worktrees ao mesmo tempo, use uma porta por worktree (`PORT=3101 npm run test:e2e`): o `reuseExistingServer` reaproveita
  qualquer servidor que já esteja na porta e testaria o build de outra pasta.
- **Regra da equipe:** PR só é integrado com o CI verde e 1 aprovação. A Vercel publica a `main` sozinha depois do merge.
