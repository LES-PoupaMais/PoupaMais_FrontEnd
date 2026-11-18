---
name: testes-frontend
description: 'Use ao escrever, corrigir ou revisar testes do front do PoupaMais: testes unitários e de componente (Vitest + Testing Library + MSW) e testes automatizados end-to-end (Playwright), ou quando a cobertura mínima reprovar o CI.'
---

# Testes do frontend

## Tipos

| Tipo               | Onde                                                              | Ferramentas                             | Comando            |
| ------------------ | ----------------------------------------------------------------- | --------------------------------------- | ------------------ |
| Unitário (funções) | ao lado do arquivo: `format.test.ts`, `lancamento.schema.test.ts` | Vitest                                  | `npm test`         |
| Componente         | ao lado do componente: `button.test.tsx`                          | Vitest + Testing Library + `user-event` | `npm test`         |
| Hooks globais      | `hooks/*.test.tsx`                                                | `renderHook` + `criarWrapper` + **MSW** | `npm test`         |
| Integração da tela | `screens/<Tela>/<Tela>View.test.tsx`                              | Provider + View + **MSW** (mock do BFF) | `npm test`         |
| End-to-end         | `e2e/*.spec.ts`                                                   | **Playwright** (Chromium, Firefox)      | `npm run test:e2e` |

## Unitário e componente

- Teste o que o usuário vê e faz: `screen.getByRole('button', { name: 'Salvar lançamento' })`, `userEvent.click`.
- Não teste classes CSS, estado interno nem detalhes de implementação.
- Componentes (inclusive organismos) são puros: teste **por props** (`vi.fn()` nos callbacks), sem MSW.
- Tela (Context + View, que usam TanStack Query): renderize com `renderComProviders` de `src/test/utils.tsx` (QueryClient novo por
  teste, sem retry). Hooks globais: `renderHook(() => useX(), { wrapper: criarWrapper().wrapper })`.
- Rota no Context (`useRouter`, `usePathname`, `useSearchParams`): `vi.mock('next/navigation', …)` com `vi.hoisted` (ver
  `screens/Dashboard/DashboardView.test.tsx`).
- Largura da tela: o jsdom não tem `matchMedia`; `src/test/media.ts` instala um falso (390px por teste) e `simularLargura(1280)` muda.
- Upload (multipart): o MSW no jsdom não lê o corpo `FormData` (Node 26 fecha o stream); confira com `vi.spyOn(http, 'post')`
  (ver `services/services.test.ts`).
- API simulada com MSW: handlers padrão em `src/test/msw/handlers.ts`; sobrescreva por teste com `server.use(...)`.
- Casos que não podem faltar:
  - `lib/format`: moeda pt-BR, período `Ago/2026`, nome do mês;
  - schemas: cada regra da RN001/RN011 e a mensagem exibida;
  - `lib/data`: data que existe, formatos "18/11/2026", "18 nov", "18 de novembro de 2026";
  - lancamento-form: erros por campo, botão desabilitado durante o envio (RNF006), erros `erros[]` da API nos campos;
  - lixeira: o Desfazer **não** chama a API; o `DELETE` só sai quando o toast fecha;
  - `AvatarUsuario`: foto quando `possuiFoto`, senão a inicial maiúscula do nome (o Radix só mostra a `<img>` depois do `load`:
    veja o `Image` falso em `src/components/atoms/avatar.test.tsx`).
- Átomos do shadcn **sem alteração nossa** não precisam de teste (ficam fora da cobertura, lista no `vitest.config.mts`).
  Átomo alterado (`// PoupaMais:`) sai da lista e ganha teste, como `button` e `avatar`.
- Dialog, Select, Popover e DropdownMenu do Radix abrem em portal: busque o conteúdo por `screen` (não pelo `container`) e
  interaja com `userEvent` (o `fireEvent` não dispara os eventos de ponteiro que o Radix espera).

## End-to-end (Playwright)

- Rodam contra `next build && next start` (o `webServer` do `playwright.config.ts` sobe sozinho).
- **Sem backend**: o teste cria a sessão com o cookie `pm_token` (o `proxy.ts` só confere a presença) e simula a API no navegador com
  `page.route('**/api/**', ...)`, usando as fixtures de `e2e/fixtures/`.
- Login/cadastro passam por Server Action (servidor → API real), então no E2E sem backend teste só a validação do formulário dessas telas.
- Fluxos mínimos (roteiro da demo): criar categoria pelo campo, lançamento com duas categorias e data, importar CSV com linha inválida,
  filtrar e tirar do saldo, lixeira + restaurar, dashboard mudando de mês, exportar.
- Layout responsivo: `page.setViewportSize({ width: 390 | 834 | 1280, … })` (ver `e2e/app-shell.spec.ts`); tema com
  `page.emulateMedia({ colorScheme: 'dark' })`.
- Nesta máquina (sem sudo): `export LD_LIBRARY_PATH=$HOME/.local/playwright-libs/root/usr/lib/x86_64-linux-gnu` antes do `npm run test:e2e`.
- Seletores por papel e texto (`getByRole`, `getByLabel`); nada de seletor CSS frágil.
- Para depurar: `npx playwright test --ui` ou o plugin `playwright` do Claude Code para navegar na app.

## Cobertura

`npm run test:coverage` falha abaixo dos pisos de `vitest.config.mts` (`coverage.thresholds`: 80% linhas/funções/statements, 70% branches).
Abaixo do piso: escreva o teste que falta, não baixe o piso. Suba o piso quando a cobertura subir de forma estável.
