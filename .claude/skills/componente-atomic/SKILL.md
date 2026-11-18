---
name: componente-atomic
description: Use ao criar, mover ou alterar um componente React do PoupaMais em components/ (átomo, molécula, organismo ou template), inclusive ao adicionar um componente do shadcn/ui ou trazer um componente do Design System para o código. Decide o nível do Atomic Design, o nome do arquivo, as importações permitidas, a pureza (só props), as variantes com cva, o 'use client' e o teste do componente.
---

# Componente no Atomic Design (com shadcn/ui)

Leia antes: seções "Arquitetura", "Atomic Design" e "Design" do `CLAUDE.md` deste repo e, no Design System,
`../Documentação/design/ds/project/components/<Nome>/README.md` e `preview.html` do componente.

## 0. A regra que não muda: componente é PURO

Tudo em `components/` recebe dados e callbacks **por props** (ou `children`/slots). Nenhum componente:

- chama `hooks/` (TanStack Query), `services/` ou `actions/`, nem `fetch`;
- lê `useRouter`, `usePathname`, `useSearchParams` ou o Context de uma tela;
- decide regra de negócio que depende da API.

Quem busca dados, guarda o estado da tela e chama as ações é o **Context da tela** (`screens/<Tela>/<Tela>Context.tsx`, skill `tela-next`).
Isso vale também para **organismos**: um `transaction-table` recebe `lancamentos`, `onAlternarSaldo(id)`, `onAbrir(id)`; ele não
sabe de onde vêm os dados. Estado só de interface (aberto/fechado, campo digitado, React Hook Form + schema Zod) pode ficar no componente.

## 1. Decidir o nível

```
É um componente do shadcn/ui (button, input, dialog, drawer, calendar…)?
├── Sim → ÁTOMO: npx shadcn@latest add <nome>   (grava em components/atoms)
└── Não → é um esqueleto de página que só posiciona slots (children, sidebar, header…)?
         ├── Sim → TEMPLATE (components/templates)
         └── Não → é uma seção completa ou conhece o domínio (lançamento, categoria, dashboard)?
                  ├── Sim → ORGANISMO (components/organisms)
                  └── Não → junta 2+ átomos de forma genérica (rótulo + campo + erro, ícone + valor…)?
                           ├── Sim → MOLÉCULA (components/molecules)
                           └── Não → ÁTOMO próprio no estilo shadcn (ex.: money-text, logo)
```

A tabela "Atomic Design" do `CLAUDE.md` já diz o nível de cada componente do Design System (B2). Antes de criar, procure se já existe:
uma variante nova num átomo resolve melhor que um componente novo (`npx shadcn@latest search <termo>`).

## 2. Arquivos (padrão shadcn em todos os níveis)

```
components/<nivel>/nome-do-componente.tsx        # export nomeado em PascalCase: export function NomeDoComponente
components/<nivel>/nome-do-componente.test.tsx   # teste ao lado
```

Sem pasta por componente e sem `index.ts`. Import: `import { MoneyText } from '@/components/atoms/money-text'`.
Nome do arquivo = nome do DS em kebab-case (`TransactionRow` → `transaction-row.tsx`).

## 3. Importações permitidas (o ESLint barra o resto)

| Nível     | Pode importar                                                             |
| --------- | ------------------------------------------------------------------------- |
| átomo     | átomos, `lib/`, `types/`                                                  |
| molécula  | átomos, moléculas, `lib/`, `types/`                                       |
| organismo | átomos, moléculas, organismos, `schemas/`, `types/`, `constants/`, `lib/` |
| template  | átomos, moléculas, organismos, templates, `lib/`, `types/`                |

Pacotes externos (`lucide-react`, `next/link`, `next/image`, `radix-ui`, `react-hook-form`) são livres. Se o lint disser
"Arquitetura: organism não pode importar hooks", o dado precisa vir por props do Context da tela.

## 4. Átomo do shadcn

1. `npx shadcn@latest add <nome>` e depois `npm run format`.
2. A CLI deste estilo gera `import { cn } from "cn"`: troque por `import { cn } from '@/lib/cn'`.
3. Se vier um hook junto (ex.: `use-mobile`), mova-o para `src/lib/` (átomo não importa `hooks/`).
4. Arquivo gerado **sem alteração**: entra na lista de exclusão de cobertura do `vitest.config.mts` (não precisa de teste).
5. **Precisa alterar o gerado?** Cada mudança leva um comentário `// PoupaMais: motivo`, o arquivo **sai** da lista de exclusão e
   ganha teste (exemplos: `button.tsx`, `avatar.tsx`).

## 5. Visual: o Design System manda

- Copie o comportamento e os estados da `preview.html` do componente (padrão, hover, foco, desabilitado, erro, carregando, vazio).
- **Cores só por token:** `bg-primary`, `bg-card`, `bg-secondary`, `text-muted-foreground`, `text-receita`, `text-despesa`,
  `bg-despesa-fundo`, `text-atencao` + `bg-atencao-fundo`, `text-destructive` (erro, não despesa)… Nunca hex.
- **Texto, raio, sombra e medidas do DS** (já no `globals.css`): `text-titulo-1|2|3`, `text-corpo`, `text-legenda`, `text-rotulo-campo`,
  `text-rotulo-secao`, `text-valor-tile`…; `rounded-card`, `rounded-grande`, `rounded-campo`, `rounded-pilula`; `shadow-card`,
  `shadow-flutuante`; `h-barra-inferior`, `w-sidebar`, `w-trilho`, `max-w-conteudo`. Token novo desses tipos → ensine o `cn` em `lib/cn.ts`.
- Valor monetário: sempre `MoneyText`. Data: `lib/data.ts`. Ícones Lucide com `aria-hidden` (decorativo) ou `aria-label` (sozinho).
- Os dois temas vêm dos tokens; use `dark:` só quando o token não resolve (ex.: trocar a imagem do logo).
- Na sidebar, use a variante `trilho:` para o modo de ícones (ver "Casca da área logada" no `CLAUDE.md`).
- Layout que depende da largura é CSS (`md:`, `lg:`), nunca `matchMedia` no componente.
- Variantes com `cva` + `cn()`. Props tipadas e exportadas (`export type XxxProps`); repasse `className` e `...props` quando fizer sentido.

## 6. 'use client'

Só se o componente tem estado, efeito ou **evento** (`onClick`, `onKeyDown`…). Um template ou átomo sem nada disso fica Server Component.
Um Server Component não pode passar função para elemento DOM: se o template repassa eventos, ele leva `'use client'` (ex.: `app-shell-template`).

## 7. Acessibilidade (RNF012, DS "Acessibilidade e casos-limite")

Rótulo visível em todo campo (`Field`/`Label`), erro ligado por `aria-describedby` + `aria-invalid`, `aria-label` em ícone-botão,
`aria-current="page"` na navegação, alvos de 44px (`min-h-11`, `size-11`), foco visível (o `globals.css` já dá o anel), diálogo começando
em Cancelar, nada só por cor (sinal + seta + texto).

## 8. Teste junto com o componente

Vitest + Testing Library, **por props**: renderize com dados de exemplo, interaja como o usuário (`userEvent`) e confira o que aparece
(`getByRole`, `getByLabelText`) e os callbacks chamados (`vi.fn()`). Não teste classes CSS nem detalhes internos (exceção: `data-*`
que o componente expõe de propósito, como o estado do `app-shell-template`). Componente puro não precisa de MSW. Detalhes: skill `testes-frontend`.

Exemplo mínimo:

```tsx
render(<TransactionRow lancamento={lancamento} onAbrir={onAbrir} />)
await userEvent.click(screen.getByRole('button', { name: 'Ver Mercado do mês' }))
expect(onAbrir).toHaveBeenCalledWith(3)
```
