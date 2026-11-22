# Design no código (tokens, tema, gráficos, acessibilidade)

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Design

**O Design System manda** (`../Documentação/design/ds/project/README.md`). Resumo do que o código já tem:

- **Tokens** em `src/styles/globals.css`: o bloco "Para copiar no código" colado sem alteração (fonte `../Documentação/design/ds/globals.css.gerado`)
  mais os complementos do front (valores de `tokens.css`). Não edite as cores aqui: mude no DS e cole de novo.
  - shadcn: `bg-background` (fundo), `bg-card` (superfície), `bg-secondary`/`bg-muted` (superfície 2), `text-muted-foreground` (texto suave),
    `bg-primary` (ação), `bg-accent` (primária fundo), `text-destructive` (**erro e exclusão**, não despesa), `border-border`, `border-input`, `ring-ring`.
  - Domínio: `text-receita`/`bg-receita-fundo`/`receita-grafico`/`receita-area`, `text-despesa`/`bg-despesa-fundo`/`despesa-grafico`/`despesa-area`,
    `bg-erro-fundo`, `text-atencao` sobre `bg-atencao-fundo`, `destaque-*` (card Saldo do mês), `bg-sobreposicao` (véu), `primaria-hover`.
    Reservados sem uso hoje: `investimento`, `compartilhado`, `destaque` (+ `-fundo`).
  - Complementos: `shadow-card`, `shadow-flutuante`, `w-sidebar`/`w-trilho`/`pl-trilho`, `h-barra-inferior`, `max-w-conteudo` (1200px),
    raios `rounded-campo`/`rounded-icone`/`rounded-card`/`rounded-grande`/`rounded-pilula`, estilos de texto `text-display`, `text-titulo-1..3`,
    `text-rotulo-secao`, `text-corpo`, `text-corpo-forte`, `text-legenda`, `text-rotulo-campo`, `text-mini`, `text-valor-destaque|tile|linha`
    (tamanho, altura de linha, peso e espaçamento juntos) e a variante `trilho:`.
  - Token novo de tamanho, sombra, raio ou medida? Ensine o `cn` em `lib/cn.ts` (senão o merge apaga classes).
- **Tema:** claro e escuro **em todas as telas** (landing e auth não são mais sempre escuras), seguindo o sistema por padrão; a classe `dark`
  vai no `<html>` pelo `next-themes`. Use `dark:` só quando o token não resolve sozinho (ex.: trocar o logo).
- **Fonte única:** Plus Jakarta Sans 500–800. Todo valor usa `tabular-nums` (`MoneyText` já usa).
- **Valores:** `MoneyText` (`components/atoms/money-text.tsx`): sempre com centavos, sinal (`+`/`−` tipográfico) + seta + cor; `tipo`
  RECEITA/DESPESA/neutro, `tamanho` destaque/tile/linha, `suave`, `ajustar`. Formatação em `lib/format.ts`.
- **Datas:** `lib/data.ts`: campo e tabela "18/11/2026", lista do celular "18 nov", visualização "18 de novembro de 2026", auditoria
  "05/11/2026 às 19:42" no fuso de quem vê. Mês do filtro "Novembro 2026" (`formatarMesAno`).
- **Logo:** átomo `logo` (`horizontal`, `sidebar`, `cofrinho`), arquivos em `public/logos/`; troca pelo tema só com CSS.
- **Gráficos** (`Graficos.md`): **área** para Receitas × Despesas dos 4 meses (curvas monotônicas, `receita-area`/`despesa-area`, tooltip com
  centavos), **barras verticais** para o saldo mensal (positivo acima do zero em `receita-grafico`, negativo abaixo em `despesa-grafico`,
  valor com sinal na barra) e **barras horizontais** para despesas por categoria (todas em `despesa-grafico`, da maior para a menor; tocar
  abre Lançamentos filtrado). Eixo começando no zero com 3 marcas redondas ("R$ 5 mil"), grade tracejada, legenda em texto e tabela `sr-only`.
  **Nunca pizza nem rosca.** Recharts pelo átomo `chart` (`--chart-1` receita, `--chart-2` despesa).
- **Princípios:** um botão preenchido por tela; uma cor de função por card; cor diferencia tipos, não instâncias (chips de categoria neutros);
  nunca só cor; toda ação termina em toast; textos com "você", sem jargão, botões começando com verbo.
- **Estados de toda tela:** carregando (Skeleton), vazio (EmptyState com a próxima ação), erro (ErrorState com "Tentar de novo") e sem
  conexão (OfflineBanner, botões que gravam desabilitados com o motivo).
- **Acessibilidade** (`Acessibilidade-e-casos-limite.md`): AA nos dois temas, foco visível (anel de 2px), alvos de 44px, `aria-current="page"`
  na navegação, `aria-live` nos toasts, diálogos começando em Cancelar, `prefers-reduced-motion` (o `globals.css` já zera as animações).
