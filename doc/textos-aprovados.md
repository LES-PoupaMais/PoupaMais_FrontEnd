# Textos aprovados fora do Design System

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Textos fora do DS, aprovados em 19/11

Textos escolhidos nas telas, sem prancheta nem frase no Design System. O líder aprovou mantê-los em 19/11/2026 (e os da
última linha da lista em 21/11/2026): não troque
sem decisão nova (e, se trocar, registre no DS). Os que se repetem entre telas ficam em `constants/textos.ts`.

- **Toasts de lançamento:** "Lançamento salvo", "Lançamento fora do saldo. Ele continua na lista.", "Lançamento de volta ao
  saldo", "Movido para a lixeira" (com Desfazer), "Restaurado como inativo. Ative para voltar ao dashboard." e, desde a
  v1.2.0 (volta ao status anterior), "Lançamento restaurado"; "Arquivo exportado", "Modelo CSV baixado".
- **Toasts de categoria:** "Categoria criada", "Categoria \"X\" criada" (pelo campo do formulário), "Categoria
  renomeada/inativada/reativada/excluída".
- **Toasts do Perfil e do acesso:** "Nome salvo", "Foto atualizada", "Foto removida", "Senha alterada", "Seus dados foram
  baixados", "Sua conta foi excluída.", "Conta criada. Este é o seu mês.", "Senha nova salva. Entre com ela.".
- **Aprovados em 21/11:** título "Mês exibido" da folha do mês no celular (`month-navigator`, também o rótulo da navegação
  do mês) e, na importação (D3), o botão "Baixar linhas ignoradas (.csv)" no `import-result` e o toast "Linhas ignoradas
  baixadas".
- **Erros genéricos de cada tela** (quando a API não manda mensagem ou é 5xx, regra de `lib/http`): "Não foi possível …"
  (salvar, mover para a lixeira, restaurar, mudar Conta no saldo, exportar, baixar o modelo, criar a categoria, enviar e
  remover a foto, salvar o nome, alterar a senha, baixar seus dados, excluir a conta), "Não foi possível salvar. O que você
  preencheu continua aqui." e "Confira os campos marcados.".
- **Frases por status** (`lib/http.MENSAGENS_POR_STATUS`): a do 401 é do DS; as de 400, 404, 409, 422, 503 e sem conexão.
- **Estados sem prancheta:** "Lançamento não encontrado · Ele pode ter sido excluído ou o endereço está errado."
  (visualização e Editar, `constants/textos`), vazio de filtro "Nada encontrado com esses filtros"/"Nada encontrado para
  “…”", erro geral com o botão "Voltar ao início" (fica) e "Não foi possível carregar as categorias.".
