---
name: tela-next
description: Use ao criar ou alterar uma tela/rota do PoupaMais no Next.js (App Router). Segue o fluxo de 4 etapas (componentes puros, Context da tela, View e rota limpa) em src/screens/<Tela>, com dados por hooks globais (TanStack Query) e Server Actions, mês na URL, Suspense do cacheComponents, proteção de rota, teste de integração da tela e E2E.
---

# Nova tela: fluxo de 4 etapas

Leia antes, no `CLAUDE.md`: "Arquitetura" (árvore e regras), "Telas" (rota e pranchetas), "Regras de negócio" e "Contrato da API".
Abra as pranchetas da tela em `../Documentação/design/telas/project/<tela>-*.dc.html` (celular, tablet, computador, escuro e cada estado).

```text
src/app/(grupo)/<rota>/page.tsx      ← 4. só rota: Suspense + Provider + View
src/screens/<Tela>/
├── <Tela>Context.tsx                ← 2. dados, estado, ações, invalidação, toasts, use<Tela>Context()
├── <Tela>View.tsx                   ← 3. Context → Template + Organisms, com todos os estados
├── <Tela>Skeleton.tsx               ←    fallback do Suspense
├── <Tela>View.test.tsx              ←    integração: Provider + View + MSW
└── index.ts                         ←    export { <Tela>Provider, <Tela>View, <Tela>Skeleton }
src/components/…                     ← 1. componentes puros (skill componente-atomic)
```

## 0. Conferir antes de começar

- Ache a tela e as RN no `CLAUDE.md`. Se o pedido contradiz uma regra, o Design System ou o contrato, pare e use a skill
  `mudanca-de-regra` (raiz do workspace).
- Endpoint que não existe no contrato: **não invente**. Combine e atualize os dois `CLAUDE.md` (este e `../PoupaMais_BackEnd/CLAUDE.md`).
- O que a tela precisa já existe em `types/api.ts`, `services/`, `hooks/`, `schemas/`? Se faltar um hook (ex.: `useImportarCsv`),
  crie em `hooks/` seguindo `use-mutacoes-lancamento.ts` (mutation que invalida com `invalidarDadosFinanceiros`), com teste em `hooks/`.

## 1. Componentes (puros, com teste)

Reutilize ou crie em `components/` (skill `componente-atomic`). Tudo por props: o organismo recebe `lancamentos`, `carregando`,
`onSalvar(dados)`; nunca chama hook de dados, service ou action. Formulário: React Hook Form + schema Zod dentro do organismo, enviando
por `onSubmit`. Botão que envia usa `<Button loading={enviando}>` (RNF006).

## 2. Context da tela (`screens/<Tela>/<Tela>Context.tsx`)

`'use client'`. Centraliza:

- **dados:** hooks globais (`useLancamentos`, `useDashboard(periodo)`, `useCategorias`…);
- **estado da tela:** filtros, painel aberto, diálogo, item selecionado;
- **filtros na URL** (mês sempre): leia com `useSearchParams` + `lerPeriodo`, escreva com `router.replace` + `comPeriodo` (`lib/periodo.ts`),
  como no `screens/Dashboard/DashboardContext.tsx`;
- **ações:** mutations (`mutate(dados, { onSuccess, onError })`) e Server Actions (`actions/`), com `useTransition` para o "enviando";
- **retorno:** toast em toda ação (`toast.success`, `toast.error`), erros da API nos campos (`erros[]` → `setError` via callback do organismo);
- **invalidação:** as mutations globais já invalidam `lancamentos` + `dashboard` + `categorias`;
- `use<Tela>Context()` que **dá erro fora do Provider**.

## 3. View (`screens/<Tela>/<Tela>View.tsx`)

`'use client'`. Consome o Context e preenche o **Template** com os **Organisms**. Prevê os 4 estados do Design System:

| Estado      | Como                                                                           |
| ----------- | ------------------------------------------------------------------------------ |
| carregando  | `Skeleton` no lugar de cada bloco (ou o slot com skeleton)                     |
| vazio       | `empty-state` com a próxima ação ("Criar primeiro lançamento", "Importar CSV") |
| erro        | `error-state` com "Tentar de novo" (`refetch`)                                 |
| sem conexão | `offline-banner` + botões que gravam desabilitados com o motivo                |

A View não busca dados nem tem regra: só decide **o que** mostrar a partir do Context. Área logada: a View monta só o conteúdo (a casca
vem do `app/(app)/layout.tsx`); o título e o mês no conteúdo aparecem a partir de 768px (no celular ficam na TopBar).

## 4. Rota limpa (`app/(grupo)/<rota>/page.tsx`) e testes

A página **só** envolve a tela no Provider e renderiza a View (o ESLint só deixa `app/` importar `screens/` e `types/`).
Com `cacheComponents`, quem lê `searchParams`/`params` (Promises no Next 16), `cookies()` ou usa `useSearchParams` fica dentro de `<Suspense>`:

- O Context lê a URL com `useSearchParams` → a página só põe o `<Suspense>` em volta (ver `app/(app)/dashboard/page.tsx`).
- A página precisa do valor no servidor → repassa a Promise para um componente interno que faz o `await` (exemplo abaixo).

Rota nova da área logada: inclua o caminho no `ROTAS_PRIVADAS` e no `matcher` do `src/proxy.ts`, em `constants/rotas.ts` e, se for destino
de navegação, em `constants/navegacao.ts`.

Testes (não está pronto sem eles):

- componentes: por props, ao lado de cada um;
- **`<Tela>View.test.tsx`:** `renderComProviders(<Provider><View /></Provider>)` com MSW (handlers padrão em `src/test/msw/handlers.ts`,
  sobrescreva com `server.use`): carregando, vazio, erro, sucesso, ação + toast. Mock de `next/navigation` com `vi.mock` quando o Context usa rota;
- **E2E** do fluxo em `e2e/<tela>.spec.ts` (sessão falsa + `page.route('**/api/**')`), nos dois navegadores.

Feche com a skill `pipeline-local`.

## Exemplo completo: tela de Login

```tsx
// src/app/(auth)/login/page.tsx — só rota
import { Suspense } from 'react'
import { LoginProvider, LoginSkeleton, LoginView } from '@/screens/Login'

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <Login searchParams={searchParams} />
    </Suspense>
  )
}

async function Login({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { voltar } = await searchParams // ex.: /login?voltar=/lancamentos/novo (sessão vencida)
  return (
    <LoginProvider voltar={voltar}>
      <LoginView />
    </LoginProvider>
  )
}
```

```tsx
// src/screens/Login/LoginContext.tsx — estado, ação e regras da tela
'use client'
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/actions/auth.actions'
import { destinoSeguro } from '@/lib/destino'
import type { LoginInput } from '@/schemas/auth.schema'

type LoginContextValue = {
  enviando: boolean
  erro: string | null
  entrar: (dados: LoginInput) => void
}
const LoginContext = createContext<LoginContextValue | null>(null)

export function LoginProvider({ voltar, children }: { voltar?: string | string[]; children: ReactNode }) {
  const router = useRouter()
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const entrar = (dados: LoginInput) =>
    iniciar(async () => {
      setErro(null)
      const resultado = await loginAction(dados) // grava o cookie httpOnly no servidor
      if (resultado.ok)
        router.replace(destinoSeguro(voltar)) // só caminho interno
      else setErro('E-mail ou senha incorretos.') // nunca diz qual dos dois
    })

  return <LoginContext.Provider value={{ enviando, erro, entrar }}>{children}</LoginContext.Provider>
}

export function useLoginContext() {
  const contexto = useContext(LoginContext)
  if (!contexto) throw new Error('useLoginContext precisa estar dentro de <LoginProvider>')
  return contexto
}
```

```tsx
// src/screens/Login/LoginView.tsx — liga o Context ao Template e ao Organism
'use client'
import Link from 'next/link'
import { ActionBanner } from '@/components/molecules/action-banner'
import { LoginForm } from '@/components/organisms/login-form'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useLoginContext } from './LoginContext'

export function LoginView() {
  const { enviando, erro, entrar } = useLoginContext()
  return (
    <AuthTemplate
      titulo="Bem-vindo de volta"
      subtitulo="Entre na sua conta para continuar."
      rodape={
        <>
          Não tem conta? <Link href={ROTAS.cadastro}>Criar conta</Link>
        </>
      }
    >
      {erro && <ActionBanner variante="erro">{erro}</ActionBanner>}
      <LoginForm enviando={enviando} onSubmit={entrar} />
    </AuthTemplate>
  )
}
```

```ts
// src/screens/Login/index.ts
export { LoginProvider } from './LoginContext'
export { LoginSkeleton } from './LoginSkeleton'
export { LoginView } from './LoginView'
```

O organismo `components/organisms/login-form.tsx` é puro: React Hook Form com `loginSchema`, os átomos e moléculas (`form-field`,
`password-field`, `button` com `loading`) e chama `onSubmit(dados)`. Testes:

- `login-form.test.tsx`: validação e envio por props;
- `LoginView.test.tsx`: Provider com a action mockada (`vi.mock('@/actions/auth.actions')`), erro e redirecionamento;
- `e2e/login.spec.ts`: validação do formulário (a Server Action chama a API real, então sem backend o E2E não faz o login de verdade).

Hoje `screens/Login` é um **placeholder** (só o `voltarPara`); o B4 completa seguindo este exemplo.
