<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PoupaMais — FrontEnd (Web)

Guia para qualquer agente de IA (Claude Code, Codex, opencode, Cursor…) e para quem programa. É curto de propósito: ele entra
no contexto em toda sessão. O detalhe fica em `doc/`, para ler **só quando a tarefa pedir** (índice abaixo).

Aplicação web de gestão financeira pessoal e familiar (projeto de LES — Fatec Guarulhos, orientação Prof. Jadir Custódio Júnior).
O usuário registra **receitas e despesas** (lançamentos, com **data**), organiza por **categorias**, importa/exporta em lote via
**CSV/Excel** e acompanha um **Dashboard** mensal. Foco: letramento financeiro e prevenção do superendividamento (ODS 1 e 8).
Web **mobile-first e responsiva** (nasce para o navegador do celular); não há app nativo (RNI001).

Este repositório é **só o front**. A API (Java + Spring Boot + PostgreSQL + JWT) fica em `LES-PoupaMais/PoupaMais_BackEnd`.
O contrato completo é o `doc/contrato-api.md` de lá; o resumo do front fica em `doc/contrato-api.md` deste repo.
Estado atual: todas as telas prontas, integradas e no ar (Vercel); histórico em `doc/historico.md`.

**Fontes da verdade (pasta do workspace `../`, fora do repo):**

| O quê | Onde | Vale para |
| --- | --- | --- |
| **Design System** (visual) | `../Documentação/design/ds/project/`: `README.md` (princípios, cor, tipografia, voz), `Navegacao-e-layout.md`, `Graficos.md`, `Acessibilidade-e-casos-limite.md`, `Preparado-para-crescer.md`, `Para-copiar-no-codigo.md`, `tokens.json`/`tokens.css` e `components/<Nome>/{README.md,preview.html}` | tokens, componentes, estados, textos |
| **Pranchetas das telas** (canvas) | `../Documentação/design/telas/project/<tela>-<celular\|tablet\|computador>.dc.html` (uma por estado; mapa em `canvas.json`) | layout de cada tela e estado |
| Decisões de design | `../Documentação/design/MUDANCAS_RODADA2.md` (**vale sobre** a revisão) e `../Documentação/md/Revisao_Perguntas_Design_PoupaMais.md` | conflitos entre documentos |
| Requisitos | `../Documentação/DVP_PoupaMais_v1.md` (versão anterior; quando divergir, vale este guia) | RF/RN |

O protótipo antigo do Figma (telas escuras, MÊS/ANO no formulário, donut, switch "ATIVO") **não vale mais**: use o Design System e as pranchetas.

## Onde está cada coisa (leia sob demanda)

| Arquivo | Quando ler |
| --- | --- |
| `doc/arquitetura.md` | Stack, árvore de `src/`, **regras obrigatórias** de importação (tabela do `eslint-plugin-boundaries`), BFF e autenticação, casca da área logada |
| `doc/atomic-design.md` | Criar ou alterar componente (nível, o que já existe, shadcn, Button, formulários) |
| `doc/telas.md` | Tela, rota, pranchetas, navegação, Categorias, Conta no saldo e Lixeira |
| `doc/design.md` | Tokens, tema, valores, datas, gráficos, princípios, estados e acessibilidade |
| `doc/textos-aprovados.md` | Antes de mudar qualquer texto de toast, erro ou estado |
| `doc/regras-de-negocio.md` | RN que mudam a UI e tratamento de erros (`lib/http.traduzirErro`) |
| `doc/contrato-api.md` | Endpoints, formato de lançamento e de erro (resumo; fonte no back) |
| `doc/pwa.md` | Manifest, service worker, offline |
| `doc/testes-e-pipeline.md` | Níveis de teste, E2E (simulado e contra a API real), cobertura, CI |
| `doc/pendencias.md` | Débito conhecido e decisões que explicam diferenças com as pranchetas (não "corrija" sem decisão) |
| `doc/historico.md` | O que foi entregue e quando |
| `doc/decisoes/` | Por que algo foi feito de um jeito (decisões, pesquisas, alternativas descartadas) |
| `doc/IDEIAS_FUTURAS.md` | Antes de propor funcionalidade nova |

### Roteiro da demo: o front precisa suportar exatamente isto (os E2E cobrem)

1. Criar uma categoria pelo próprio campo de categorias do formulário → 2. Cadastrar lançamento com **duas** categorias e **data** →
3. Importar CSV com uma linha inválida (mostrar quais linhas falharam) → 4. Filtrar e **tirar do saldo** um lançamento →
5. Ver o dashboard atualizado → 6. Exportar lançamentos.

## Stack em uma linha

Next.js 16 (App Router, `cacheComponents`) + React 19 + TypeScript, Tailwind 4 + shadcn/ui, TanStack Query, React Hook Form + Zod,
Recharts, Vitest + MSW e Playwright. Tabela completa em `doc/arquitetura.md`. O Next 16 tem mudanças grandes: leia o bloco do
Next no topo deste arquivo e a documentação em `node_modules/next/dist/docs/` antes de usar API do Next que você não viu neste repo.

**Node:** nvm com Node 26 LTS. O repo tem `.nvmrc` (`26`): rode `nvm use` ao entrar na pasta (o Node 18 do sistema não serve).

## Comandos

```bash
nvm use                 # Node da .nvmrc
npm run dev             # http://localhost:3000
npm run lint            # ESLint (inclui as regras da Arquitetura)
npm run format          # Prettier (format:check no CI)
npm run typecheck       # next typegen + tsc --noEmit
npm test                # Vitest
npm run test:coverage   # Vitest + piso de cobertura (o que o CI roda)
npm run test:e2e        # Playwright (sobe o build sozinho), API simulada
npm run test:e2e:api-real  # Playwright contra a API real (pilha E2E do PoupaMais_Development; ver doc/testes-e-pipeline.md)
npm run build           # build de produção
```

`.env.local` (variáveis **só do servidor**, sem `NEXT_PUBLIC_`; o navegador nunca vê a URL nem o token da API):

```
API_URL=http://localhost:8080
```

E2E nesta máquina (WSL sem sudo): os navegadores precisam de
`export LD_LIBRARY_PATH=$HOME/.local/playwright-libs/root/usr/lib/x86_64-linux-gnu` (Chromium e Firefox já instalados em
`~/.cache/ms-playwright`). Não use `--with-deps` localmente; no CI ele é usado.

## Regras que valem para toda tarefa

- **Camadas:** `app/` só rotas → `screens/<Tela>` (Context + View: dados, estado, ações) → `components/` puros (Atomic Design, só
  props). Dados: `lib/http` → `services/` → `hooks/` → **Context da tela** → props dos organismos. Nenhum componente monta URL nem
  chama `fetch`; uma tela não importa outra. O `eslint-plugin-boundaries` impõe isso (tabela em `doc/arquitetura.md`).
- **O Design System manda** (`../Documentação/design/ds/project/README.md`): cores só por token, nunca hex; claro e escuro em
  todas as telas; estados carregando, vazio, erro e sem conexão. Detalhes em `doc/design.md`.
- **Textos aprovados não mudam sem decisão nova** (`doc/textos-aprovados.md`).
- **Erros:** o front não deduz a causa; tudo passa por `lib/http.traduzirErro` (`doc/regras-de-negocio.md`).

## Convenções

- `components/`, `hooks/`, `services/`, `schemas/`, `lib/`: arquivos em kebab-case (`transaction-row.tsx`, `use-lancamentos.ts`), exports
  PascalCase (componentes) e camelCase (`useLancamentos`); services `xxx.service.ts` (objeto `xxxService`); schemas `xxx.schema.ts`.
  `screens/`: pasta e arquivos PascalCase.
- Textos de interface em português; identificadores sem acento.
- Query keys só por `constants/query-keys.ts`; rotas por `constants/rotas.ts`; destinos da navegação por `constants/navegacao.ts`.
- Valores sempre por `MoneyText`/`lib/format.ts`; datas por `lib/data.ts`. A API trabalha com número decimal.
- Nada de token em `localStorage`; a sessão é só o cookie httpOnly. `localStorage` só para conveniência (nunca para dados).
- Responsivo mobile-first; testar em Chrome, Edge e Firefox (RNF016).
- Toda tela ou componente nasce **com testes**. Sem teste, não está pronto.
- **Git (Gitflow):** `feat/<card>` criada a partir da `development` → PR para a `development` → quando estável, PR `development` → `main`.
  Nunca PR de `feat/*` direto para a `main` e nunca commit direto na `development` ou na `main`. Conventional Commits em português
  (`feat(dashboard): ...`).

## Definição de pronto

Lint, `format:check`, typecheck, `test:coverage`, build e E2E verdes (os mesmos passos do CI, `doc/testes-e-pipeline.md`).
Mexeu em chamada à API? O resumo em `doc/contrato-api.md` bate com o contrato do back. Se algum passo não rodou, a tarefa
**não está pronta**: diga exatamente o que faltou. O que ficar de fora vira item em `doc/pendencias.md`.

## Memória do projeto (vale para qualquer IA)

- **O que não virou código também se registra.** Decisão tomada, pesquisa feita, alternativa descartada e o motivo: um arquivo em
  `doc/decisoes/` (modelo em `doc/decisoes/README.md`), no mesmo PR. Armadilha nova vai para o `doc/` do assunto.
- **Troca de agente ou sessão longa:** antes de encerrar, escreva `HANDOFF.md` na raiz (estado, decisões, próximos passos,
  dúvidas abertas). Quem continua lê e apaga. O arquivo não vai para o Git (`.gitignore`).
- Este guia fica curto: regra nova entra aqui só se valer para toda tarefa; o resto vai para `doc/`.

## Direção futura (ideias a discutir)

Leia `doc/IDEIAS_FUTURAS.md` antes de propor funcionalidade nova, e a seção "Preparado para crescer" do Design System: o que já está
reservado (cores, navegação, casca de visualização) para crescer sem refazer o design. Nada disso é para implementar sem decisão da equipe.
