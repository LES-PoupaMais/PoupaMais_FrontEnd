---
name: testes-frontend
description: Use ao escrever, corrigir ou revisar testes do front do PoupaMais: testes unitários e de componente (Vitest + Testing Library + MSW) e testes automatizados end-to-end (Playwright), ou quando a cobertura mínima reprovar o CI.
---

# Testes do frontend

## Tipos

| Tipo                | Onde                                                              | Ferramentas                             | Comando            |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------- | ------------------ |
| Unitário (funções)  | ao lado do arquivo: `format.test.ts`, `lancamento.schema.test.ts` | Vitest                                  | `npm test`         |
| Componente          | ao lado do componente: `button.test.tsx`                          | Vitest + Testing Library + `user-event` | `npm test`         |
| Organismo com dados | ao lado do organismo                                              | + **MSW** (mock do BFF `/api/*`)        | `npm test`         |
| End-to-end          | `e2e/*.spec.ts`                                                   | **Playwright** (Chromium, Firefox)      | `npm run test:e2e` |

## Unitário e componente

- Teste o que o usuário vê e faz: `screen.getByRole('button', { name: 'Salvar lançamento' })`, `userEvent.click`.
- Não teste classes CSS, estado interno nem detalhes de implementação.
- Organismo que usa TanStack Query: renderize com o helper `renderComProviders` de `src/test/utils.tsx` (QueryClient novo por teste,
  sem retry).
- API simulada com MSW: handlers padrão em `src/test/msw/handlers.ts`; sobrescreva por teste com `server.use(...)`.
- Casos que não podem faltar:
  - `lib/format`: moeda pt-BR, período `Ago/2026`, nome do mês;
  - schemas: cada regra da RN001/RN011 e a mensagem exibida;
  - LancamentoForm: erros por campo, botão desabilitado durante o envio (RNF006), erros `erros[]` da API nos campos;
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
- Fluxos mínimos (roteiro da demo): criar categoria pelo dropdown, lançamento com duas categorias, importar CSV com linha inválida,
  filtrar e inativar, lixeira + restaurar, dashboard mudando de mês, exportar.
- Seletores por papel e texto (`getByRole`, `getByLabel`); nada de seletor CSS frágil.
- Para depurar: `npx playwright test --ui` ou o plugin `playwright` do Claude Code para navegar na app.

## Cobertura

`npm run test:coverage` falha abaixo dos pisos de `vitest.config.mts` (`coverage.thresholds`: 80% linhas/funções/statements, 70% branches).
Abaixo do piso: escreva o teste que falta, não baixe o piso. Suba o piso quando a cobertura subir de forma estável.
