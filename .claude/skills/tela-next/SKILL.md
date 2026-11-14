---
name: tela-next
description: "Use ao criar ou alterar uma tela/rota do PoupaMais no Next.js (App Router): page, layout, template, organismos, hook de dados, service, schema Zod, Server Action, proteção de rota, chamada via BFF e testes unitários e end-to-end."
---

# Nova tela no Next.js

Leia antes: "Telas", "Arquitetura" e "Contrato da API" no `CLAUDE.md` deste repo.

## 1. Conferir a regra e o protótipo

- Ache a tela e as RN relacionadas no `CLAUDE.md`. Se o pedido contradiz uma regra, pare e use a skill `mudanca-de-regra` (raiz do workspace).
- A tela existe no protótipo? Siga-o. Não existe? Siga o visual das telas irmãs (auth escuras, área logada clara).

## 2. Ordem de implementação (de baixo para cima)

1. `types/api.ts`: tipos dos DTOs usados (iguais ao contrato).
2. `services/xxx.service.ts`: funções puras que chamam o BFF (`/api/...`) via `lib/http`. Sem React.
3. `constants/query-keys.ts` + `hooks/use-xxx.ts` (export `useXxx`): TanStack Query. Mutations invalidam as queries afetadas
   (ex.: alterar lançamento → `lancamentos` **e** `dashboard`).
4. `schemas/xxx.schema.ts`: Zod com as regras (RN001, RN011…) e mensagens em português.
5. Organismos em `components/organisms/nome-do-organismo.tsx` (skill `componente-atomic`), **compondo átomos do shadcn**
   (`Card`, `Field`, `Input`, `Select`, `Dialog`, `Table`, `Chart`…). Botão que envia usa `<Button loading={isPending}>` (RNF006).
   Faltou um átomo? `npx shadcn@latest add <nome>`.
6. `app/(grupo)/rota/page.tsx`: Server Component que lê `params`/`searchParams` e monta organismos (o template vem do `layout.tsx`
   do grupo: `(public)`/`(auth)` escuros, `(app)` claro). Sem fetch direto. Com `cacheComponents` ligado, o que ler `cookies()`/
   `searchParams` no servidor fica dentro de `<Suspense>`.
7. Rota protegida? Inclua o caminho no `matcher` do `src/proxy.ts`.
8. Login, cadastro, troca de senha e exclusão de conta: **Server Actions** em `actions/` (gravam/apagam o cookie). O resto vai pelo BFF.

## 3. Estados que toda tela de dados precisa

Carregando (átomo `skeleton` ou `Button loading`), vazio (mensagem do `CLAUDE.md`), erro (toast do `sonner` com a `mensagem` da API + erros por campo via
`setError`) e sucesso (toast "Operação concluída").

## 4. Testes

- Unitário/componente dos organismos novos (Vitest + RTL + MSW).
- **E2E (Playwright)** do fluxo principal da tela em `e2e/`: sessão falsa via cookie e API simulada com `page.route('**/api/**')`.
- Detalhes: skill `testes-frontend`. Feche com a skill `pipeline-local`.

## 5. Contrato

Se a tela precisa de um endpoint que não existe, **não invente**: combine o contrato e atualize os dois `CLAUDE.md`
(este e `../PoupaMais_BackEnd/CLAUDE.md`). Enquanto o back não fica pronto, o service pode devolver mock.
