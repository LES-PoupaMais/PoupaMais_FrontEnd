---
name: componente-atomic
description: Use ao criar, mover ou alterar um componente React do PoupaMais (átomo, molécula, organismo ou template), inclusive ao adicionar um componente do shadcn/ui. Decide o nível do Atomic Design, o nome do arquivo, as importações permitidas, as variantes com cva, o 'use client' e o teste do componente.
---

# Componente no Atomic Design (com shadcn/ui)

Leia antes: seções "Atomic Design" e "Design" do `CLAUDE.md` deste repo.

## 1. Decidir o nível

```
É um componente do shadcn/ui (button, input, dialog, select…)?
├── Sim → ÁTOMO: npx shadcn@latest add <nome>   (grava em components/atoms)
└── Não → tem regra de negócio, conhece "lançamento"/"categoria" ou usa hook de dados?
         ├── Sim → ORGANISMO (components/organisms)
         └── Não → é um esqueleto de página com slots (children)?
                  ├── Sim → TEMPLATE (components/templates)
                  └── Não → junta 2+ átomos (label + input + erro, card + ícone + valor…)?
                           ├── Sim → MOLÉCULA (components/molecules)
                           └── Não → ÁTOMO próprio (ex.: money-text, logo), no estilo shadcn
```

Antes de criar, procure se já existe: um átomo do shadcn com uma variante nova resolve melhor que um componente novo.
Veja a lista em https://ui.shadcn.com/docs/components (ou `npx shadcn@latest search <termo>`).

## 2. Arquivos (padrão shadcn em todos os níveis)

```
components/<nivel>/nome-do-componente.tsx        # export nomeado em PascalCase: export function NomeDoComponente
components/<nivel>/nome-do-componente.test.tsx   # teste ao lado
```

Sem pasta por componente e sem `index.ts`. Import: `import { Button } from '@/components/atoms/button'`.

## 3. Átomo do shadcn

1. `npx shadcn@latest add <nome>` e depois `npm run format`.
2. A CLI deste estilo gera `import { cn } from "cn"`: troque por `import { cn } from '@/lib/cn'`.
3. Se vier um hook junto (ex.: `use-mobile`), mova-o para `src/lib/` (átomo não importa `hooks/`).
4. Arquivo gerado **sem alteração**: entra na lista de exclusão de cobertura do `vitest.config.mts` (não precisa de teste).
5. **Precisa alterar o gerado?** Cada mudança leva um comentário `// PoupaMais: motivo`, o arquivo **sai** da lista de exclusão e
   ganha teste. Exemplos no repo: `button.tsx` (variantes `success` e `xl`, prop `loading`), `avatar.tsx` (`AvatarUsuario` com a
   inicial do nome), `sonner.tsx` (tema fixo).

## 4. Molécula, organismo e template

- **Compõem** os átomos do shadcn (Card, Field, Input, Dialog, Popover + Command para multiselect…); não recriam do zero.
- Variantes com `cva` + `cn()` (`@/lib/cn`). Cores só pelos tokens (`bg-primary`, `bg-success`, `text-despesa`, `bg-categoria-fundo`…).
- Props tipadas e exportadas; repasse `className`.
- `'use client'` só se há estado, efeito ou evento. Templates não têm. Template de tela escura aplica a classe `dark`.
- Acessibilidade (RNF012): rótulo em todo campo (`Field`/`Label`), `aria-label` em ícone-botão, foco visível, contraste.

## 5. Importações permitidas (o ESLint barra o resto)

| Nível     | Pode importar                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| átomo     | átomos, `lib/`, `types/`                                                                                     |
| molécula  | átomos, moléculas, `lib/`, `types/`                                                                          |
| organismo | átomos, moléculas, organismos, `hooks/`, `schemas/`, `types/`, `constants/`, `lib/`, `actions/`, `services/` |
| template  | átomos, moléculas, organismos, templates, `lib/`, `types/`                                                   |

## 6. Teste junto com o componente

Vitest + Testing Library: renderiza, interage como o usuário (`userEvent`) e verifica o que aparece (`getByRole`, `getByLabelText`).
Não teste classes CSS nem detalhes internos. Organismo com dados: mock da API com MSW (skill `testes-frontend`).

## 7. Visual

**O protótipo do Figma manda** (seção "Design" do `CLAUDE.md`): o estilo padrão do shadcn é ajustado por `className`/variantes até
ficar igual ao protótipo. Use o plugin `frontend-design` só para telas fora do protótipo, mantendo a identidade (cores, Outfit/DM Sans,
valores em fonte mono).
