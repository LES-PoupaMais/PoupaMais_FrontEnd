# Regras de negócio que afetam a UI

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Regras de negócio que afetam a UI

- **RN001** (revista em 18/11/2026): `schemas/lancamento.schema.ts`: descrição obrigatória (≤ 100), tipo, **data** obrigatória (dia que
  exista, de 01/01/2000 a 31/12/2100, trafega como `AAAA-MM-DD`), valor > 0 (até R$ 999.999.999,99), ≥ 1 categoria. Listagens e dashboard
  continuam filtrados por mês/ano. Mostrar erro por campo; também exibir os `erros[]` vindos da API (`setError` do RHF).
  Mensagens do DS e da prancheta `novo-erros-celular` (decisão de 20/11); sem frase no DS, "Informe a data."; data fora da faixa
  com a mesma frase do DatePicker (`lib/data.mensagemDataForaDaFaixa`).
- **RN002**: várias categorias por lançamento; criar pelo próprio campo; categorias inativas não podem ser selecionadas.
- **RN003/RN004**: o dashboard só reflete lançamentos que contam no saldo (ATIVO); após mudar "Conta no saldo", invalidar o dashboard
  (as mutations de `hooks/use-mutacoes-lancamento.ts` já invalidam lista, lixeira, dashboard e categorias, pelo mapa de `lib/invalidacoes.ts`). `taxaGasto` `null` → "Não disponível para o período".
- **RN006**: ATIVO/INATIVO alternam livremente; DELETADO só sai pelo restaurar (v1.2.0: volta ao status anterior; itens antigos sem
  esse dado voltam INATIVO).
- **RN007**: após importar, resumo "X lançamentos importados, Y linhas ignoradas" + linha e motivo de cada falha + categorias criadas.
  Com falhas, "Baixar linhas ignoradas (.csv)": a tela monta no navegador (`lib/linhas-ignoradas`, sem chamar a API) o cabeçalho
  do modelo seguido dos `falhas[].conteudo` como vieram, **sem** a coluna de motivo (para reenviar sem editar), com BOM UTF-8 e
  `\r\n`, e baixa `linhas-ignoradas-AAAA-MM-DD.csv` por `lib/baixar-arquivo`.
- **RN008**: gráficos de 4 meses, top 5 despesas e `pesoMaioresDespesas` vêm prontos da API; o front só renderiza.
- **RN010 / RNI003**: mostrar a `mensagem` do dashboard (neutra). **Nunca** recomendar investimento.
- **RF005 / RN013**: filtros por descrição, mês, ano, tipo, status e categoria; a exportação usa os filtros ativos.
- **RN011**: `schemas/auth.schema.ts`: nome ≤ 150, e-mail válido ≤ 100, senha de 6 a 72 com confirmação, aceite da Política obrigatório.
- **RN012**: antes de enviar o CSV, checar no front se tem até 2 MB (a API também recusa acima de 5.000 linhas).
- **RN014**: na recuperação de senha, nunca dizer se o e-mail existe.
- **RN015**: foto JPG/PNG/WEBP até 2 MB (validar antes de enviar). E-mail não editável. Trocar a senha devolve token novo (Server Action troca o cookie).
- **RN016**: excluir conta → diálogo (digitar EXCLUIR + senha, oferecendo antes "Baixar meus dados") → Server Action → apagar o cookie → `/` com toast.
- **RNF006**: botão que envia dados fica **desabilitado com spinner** até a resposta (`<Button loading={isPending}>`). Lançamentos iguais são válidos.
- Mensagens claras, em português, sem termos técnicos (RNF007, RNF009, RNF010). **Erros (decisão de 19/11):** o front não deduz a
  causa pelo texto nem por status genérico. Mensagem da API → como veio; `erros[]` com campo → no campo; sem mensagem → a frase da
  tela ou do status; sem conexão, 401 e 5xx → frases do front. Tudo em `lib/http.traduzirErro` (mude lá, não nas telas).
  Ficaram no front só os status que o contrato dá a um caso único e que mudam a tela: 401 no login (credenciais), 409 no
  cadastro e na categoria (a mensagem da API vai no campo E-mail/Nome), 422 no redefinir senha (link expirado) e no excluir
  categoria (em uso), 404 no `GET` por id (não encontrado). Sem `campo` no `erros[]`, a senha atual errada (troca de senha) sai
  em toast; com um `erros[]` por campo vindo do back, volta para o campo sozinha.
