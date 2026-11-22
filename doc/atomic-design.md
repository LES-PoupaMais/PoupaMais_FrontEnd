# Atomic Design (componentes)

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Atomic Design

| Nível | Pasta | O que é | Exemplos (nome do DS → arquivo) |
| --- | --- | --- | --- |
| **Átomos** | `components/atoms` | shadcn/ui + átomos próprios no mesmo estilo. Sem domínio | **button** ✓, **input** ✓, **textarea** ✓, **label** ✓, **checkbox** ✓, **switch** ✓, **select** ✓, **badge** ✓, **avatar** ✓, **tooltip** ✓, **skeleton** ✓, separator, **dialog/alert-dialog** ✓, **popover** ✓, **drawer** ✓, **sheet** ✓ (véu com `overlayClassName`), sonner, chart; próprios: **logo** ✓, **money-text** ✓, **calendar** ✓, **function-icon** ✓, **progress** ✓ |
| **Moléculas** | `components/molecules` | Combinação de átomos, genérica | **form-field** ✓, **password-field** ✓, **money-field** ✓, **date-picker** ✓ (dias/meses/anos), **month-navigator** ✓, **segmented-control** ✓, **chip/filter-chip** ✓, **multi-select** ✓, **stat-card** ✓, **spend-rate** ✓, **labeled-progress** ✓, **empty-state** ✓, **error-state** ✓, **offline-banner** ✓, **action-banner** ✓, **confirm-dialog** ✓, **upload-area** ✓, **stepper** ✓, **timeline** ✓, **sub-row-list** ✓, **section-header** ✓ |
| **Organismos** | `components/organisms` | Seções completas, podem conhecer o domínio, **sem dados próprios** | **sidebar** ✓, **bottom-nav** ✓, **top-bar** ✓, **create-sheet** ✓, **highlight-card** ✓, **income-expense-chart** ✓, **balance-chart** ✓, **category-bar-chart** ✓, **maiores-despesas** ✓, **dashboard-secao** ✓ (card das seções do Dashboard), **transaction-row** ✓, **transaction-table** ✓, **transaction-detail** ✓, **filter-bar** ✓, **lancamento-form** ✓, **export-dialog** ✓, **categoria-dialog** ✓, **import-result** ✓, **formato-csv** ✓ (Importar), **categoria-lista** ✓ (Categorias), **excluir-conta-dialog** ✓, **login-form** ✓, **cadastro-form** ✓; do Perfil: **perfil-secao** ✓, **foto-perfil** ✓, **dados-pessoais-form** ✓, **alterar-senha-form** ✓, **aparencia-tema** ✓, **perfil-atalhos** ✓ |
| **Templates** | `components/templates` | Só layout e slots | **app-shell-template** ✓, **auth-template** ✓, **public-template** ✓, **dashboard-template** ✓, **form-page-template** ✓, **perfil-template** ✓ |

✓ = já existe. Cada componente nasce com teste e segue a preview do Design System (`../Documentação/design/ds/project/components/<Nome>/`):
tokens, estados e acessibilidade. Passo a passo: skill `componente-atomic`.

- **Novo átomo do shadcn:** `npx shadcn@latest add <nome>` (grava em `components/atoms`), depois `npm run format`.
  A CLI gera `import { cn } from "cn"`: troque por `@/lib/cn`. Hook que vier junto (ex.: `use-mobile`) vai para `lib/`.
- **Átomo gerado não é editado sem motivo.** Se precisar, marque cada alteração com `// PoupaMais:`, tire o arquivo da lista de exclusão
  de cobertura do `vitest.config.mts` e escreva o teste (exemplos: `button`, `avatar`).
- Moléculas e organismos **compõem** átomos do shadcn; não recriam botão/input/dialog do zero.
- **Button** (DS): variantes `primario` (padrão), `contornado`, `texto`, `perigo`, `perigo-texto`; tamanhos `padrao` (48px), `pequeno` (36px),
  `icone` (44px); `loading` = spinner + `aria-busy` + `aria-disabled` (mantém o foco e não envia de novo). Os nomes do shadcn (`default`,
  `outline`, `ghost`, `destructive`, `sm`, `icon`…) ficam como **apelidos** porque os átomos gerados pela CLI os usam; código novo usa os do DS.
- **Formulário:** `FormField` liga rótulo, ajuda, contador e erro ao controle (`id`, `aria-describedby`, `aria-invalid`); `PasswordField`,
  `MoneyField` (devolve **número** ou `null`; `parseBRL`/`formatarNumeroBR` em `lib/format`) e `DatePicker` (devolve **ISO** ou `null`;
  `lerDataDigitada` em `lib/data`) já usam o `FormField`. Com React Hook Form, use `Controller` para os campos controlados (money, data,
  multi-select, segmentado) e `register` para Input/PasswordField (repassam o `ref`).
- **DatePicker:** `apresentacao="popover"` (computador) ou `"folha"` (celular): quem decide é a tela (`useMediaQuery` no Context/View), o
  componente não lê a largura. O calendário é o átomo próprio `calendar` (três visões e teclado do DS, sem react-day-picker); `modo="mes"`
  serve ao MonthNavigator (`seletor="popover"|"folha"`). A folha (`drawer`) usa o Dialog do Radix (sem `vaul`, que não desmonta no
  jsdom): fecha pelo ×, véu ou Esc. Só a folha Criar (`create-sheet`) fecha também ao arrastar para baixo.
- Variantes via `cva`; cores só por token (`bg-primary`, `text-receita`, `bg-despesa-fundo`, `text-atencao`…), nunca hex.
- `'use client'` só onde há estado, efeito ou **evento** (ex.: o `AppShellTemplate`, que repassa o clique do véu e o Esc).
