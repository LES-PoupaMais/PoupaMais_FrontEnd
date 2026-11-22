# Telas e navegação

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Telas

Ordem de implementação (B4, pelo roteiro da demo). Cada tela segue o fluxo de 4 etapas da skill `tela-next`
(componentes → Context → View → rota limpa + testes) e é comparada com as pranchetas nos temas claro e escuro, a 390, 834 e 1440px.

| # | Telas | Rotas | Pranchetas (`../Documentação/design/telas/project/`) |
| --- | --- | --- | --- |
| 1 | Login, Cadastro, Esqueci e Redefinir senha, Sessão vencida | `(auth)/login`, `cadastro`, `esqueci-senha`, `redefinir-senha` | `login-*`, `cadastro-*`, `esqueci-*`, `redefinir-*`, `sessao-vencida-celular` |
| 2 | Dashboard (todos os estados) | `(app)/dashboard?mes&ano` | `dashboard-*` (celular, tablet, computador, escuro, recolhida, vazio, erro, carregando, atenção, acima, criar, menu-tablet) |
| 3 | Lançamentos: lista, filtros, visualização (painel/tela), Conta no saldo, mover para a lixeira com Desfazer | `(app)/lancamentos`, `lancamentos/[id]` | `lancamentos-*`, `lancamento-detalhe-*` |
| 4 | Novo/Editar lançamento (DatePicker, categorias com criar nova, descartar) | `lancamentos/novo`, `lancamentos/[id]/editar` | `novo-*`, `editar-*`, `nova-categoria-inline-celular`, `novo-categorias-celular` |
| 5 | Importar CSV + resultado · Exportar | `lancamentos/importar` (+ diálogo de exportar) | `importar-*`, `importando-celular`, `exportar-*` |
| 6 | Categorias | `(app)/categorias` | `categorias-*`, `categoria-*` |
| 7 | Lixeira (subtela de Lançamentos) | `lancamentos/lixeira` | `lixeira-*`, `editar-lixeira-computador` |
| 8 | Perfil (foto, senha, tema, dados LGPD, excluir conta) | `(app)/perfil` | `perfil-*`, `excluir-conta-*` |
| 9 | Landing, Privacidade, 404, erro global | `(public)/`, `privacidade`, `not-found`, `error` | `landing-*`, `privacidade-*`, `nao-encontrado-*`, `erro-geral-computador`; globais: `sem-internet-*`, `toasts-celular` |

Erro no próprio layout raiz: `app/global-error.tsx` (`<html>`/`<body>` próprios com a fonte e o CSS global) com a
`ErroGlobalView` (`screens/ErroGeral`), que repõe o tema com um `ThemeProvider` só dela e mostra o mesmo erro da área pública.

Regras de navegação e layout (DS, `Navegacao-e-layout.md`):

- **Mês na URL** (`MonthNavigator`), compartilhado por Dashboard e Lançamentos; a Lixeira não depende do mês. O nome do mês abre
  o calendário no modo mês (prop `seletor`: `popover` no cabeçalho do Dashboard e na `FilterBar`, `folha` na TopBar do celular,
  com o título "Mês exibido").
- **Folha Criar** (celular): fecha ao arrastar para baixo pela alça ou pelo título (80px ou um gesto rápido; com
  `prefers-reduced-motion` não acompanha o dedo, só fecha).
- **Lixeira, Novo, Editar, Visualizar e Importar são subtelas de Lançamentos:** na barra inferior o ativo é Lançamentos e o "‹" volta
  para Lançamentos (`constants/navegacao.itemAtivo`).
- **Formulário:** tela inteira com "Salvar lançamento" fixo no rodapé no celular; card centralizado no computador (`FormPageTemplate`).
  Sair com alterações não salvas pergunta antes ("Descartar alterações?", ConfirmDialog).
- **Visualizar lançamento** (TransactionDetail): abre ao tocar em qualquer lugar da linha; tela cheia no celular, painel à direita
  (~440px, com véu) no computador; ação principal Editar (na lixeira, Restaurar).
- **Lista:** cards (TransactionRow) + filtros em chips e folha no celular; tabela (TransactionTable) + barra de filtros acima no computador.
- **Busca:** filtra 500 ms depois da última tecla (`ESPERA_BUSCA_MS` e `useValorComEspera` em `hooks/use-valor-com-espera.ts`) e vai para a
  URL com `router.replace` (`?q=`, sem encher o histórico). O texto do campo fica no `LancamentosContext` (a `FilterBar` recebe `busca`
  e `onBuscaChange`) e é a fonte da verdade enquanto a pessoa digita: a URL só reescreve o campo quando muda por fora (Limpar filtros,
  chip removido, voltar no navegador), nunca pelo eco da própria busca, mesmo atrasado.
- **Dashboard (computador, 12 colunas):** Saldo (4) + tiles Receitas, Despesas e Taxa de gasto (8) · área Receitas × Despesas (8) +
  Saldo mensal (4) · Despesas por categoria (6) + Maiores despesas (6). Tablet em 2 colunas; celular em 1 coluna nessa ordem (`DashboardTemplate`).
- Destinos da sidebar: "Dia a dia" (Dashboard, Lançamentos, Categorias, Lixeira) e "Conta" (Perfil, Sair). Sem sino e sem menu ☰.
- **Avatar:** se `possuiFoto`, `/api/usuarios/me/foto?v={versão}` (`usuarioService.urlDaFoto`; mude a versão após trocar a foto); senão,
  a inicial do nome em maiúscula.

### Categorias (RF011 / UC009 / RN002)

- Tela própria **Categorias** (lista com criar, renomear, inativar, reativar e excluir; contagem de lançamentos do mês com
  `quantidadeLancamentos`).
- **Excluir** pede confirmação (`ConfirmDialog` "Excluir categoria?", decisão de 20/11) antes do `DELETE`. Categoria em uso
  (`422` no `DELETE`): a `mensagem` da API aparece no aviso de atenção do diálogo, com "Inativar categoria".
- No formulário de lançamento, o campo de categorias (multi-select) permite **criar uma nova no próprio campo**; a criada já entra selecionada.
  Categorias inativas não são selecionáveis.
- `409` = "Já existe uma categoria com essa descrição" (a `mensagem` da API, sem diferenciar maiúsculas/minúsculas), mostrado no
  campo do diálogo.
- Depois de criar, editar, inativar, reativar ou excluir: recarregar `categorias`, `lancamentos` e `dashboard` (`categoriaAlterada` em
  `lib/invalidacoes.ts`; os hooks já fazem).

### Conta no saldo e Lixeira (RN004 / RN006 / UC010)

- **"Conta no saldo"** (switch; nunca "Ativo"): ATIVO ⇄ INATIVO (`PATCH /lancamentos/{id}/status`; no formulário, o `status` vai no
  próprio `POST`/`PUT`, numa chamada só). Fora do saldo continua na lista,
  com o valor suave (`MoneyText suave`), e sai do dashboard.
- **"Mover para a lixeira"**, sem modal (decisão do líder, 19/11): o `DELETE /lancamentos/{id}` vai **na hora**, a linha some e
  aparece o toast "Movido para a lixeira · **Desfazer**" (5 s, com contador e barra). O **Desfazer chama o restaurar**, que volta ao
  status de antes (v1.2.0). Tudo em `hooks/use-lixeira` (`useMoverParaLixeiraComDesfazer`), usado na lista, na visualização e no
  Editar; erro no DELETE ou no restaurar mostra o aviso e recarrega lista, dashboard e lixeira.
- **Lixeira** (`/lancamentos/lixeira`, `status=DELETADO`): sem switch e sem Editar; ação **Restaurar** (`useRestaurarLancamento`, só pelo
  `POST /restaurar`: o `PATCH /status` de item na lixeira dá `422`) e o toast pelo status devolvido (`constants/textos`):
  "Restaurado como inativo. Ative para voltar ao dashboard." (INATIVO) ou "Lançamento restaurado" (ATIVO).
- Lançamento na lixeira não pode ser editado: em `/lancamentos/[id]/editar` mostrar o aviso e Restaurar.
- A exportação segue o filtro e não leva os itens da lixeira; a Lixeira não tem Exportar (decisão de 20/11).
