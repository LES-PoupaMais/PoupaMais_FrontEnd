# Contrato da API (resumo do front)

> A fonte única do contrato é o `doc/contrato-api.md` do PoupaMais_BackEnd (localmente `../PoupaMais_BackEnd/doc/contrato-api.md`; em worktree, `gh api 'repos/LES-PoupaMais/PoupaMais_BackEnd/contents/doc/contrato-api.md?ref=development' -H 'Accept: application/vnd.github.raw'`). Aqui fica o resumo e como o front consome. Mudou lá, atualize aqui no mesmo PR.

## Contrato da API (espelho do `doc/contrato-api.md` do backend)

Versão do contrato: **v1.2.0** (20/11/2026): `status` no POST/PUT de lançamento, restaurar ao status anterior, `codigo` em toda
resposta de erro (sempre em JSON, com qualquer `Accept`), `data` em `maioresDespesas` e a rota de saúde.

O navegador chama `/api/...` do **próprio Next**; o BFF repassa para `${API_URL}/api/...` com `Authorization: Bearer <token>`. JSON camelCase.
Login, cadastro, troca de senha e exclusão de conta passam por **Server Actions** (que chamam a API e gravam o cookie), não pelo BFF.
No código: tipos em `types/api.ts`, chamadas em `services/*.service.ts`, cache em `hooks/` e chaves em `constants/query-keys.ts`.

**Saúde** (actuator, fora do `/api`; o front não usa): `GET /actuator/health` **público** (sem token) → `200` `{"status":"UP"}` ·
banco fora do ar → `503` `{"status":"DOWN"}`. Sem detalhes. É o healthcheck do container da API (`Dockerfile` do back e
PoupaMais_Development). Não segue o formato de erro abaixo (é o formato do actuator).

- `POST /auth/cadastro` `{nome, email, senha, aceiteTermos}` → `201` · e-mail já usado → `409`. O cadastro já cria as 11 categorias
  padrão (Alimentação, Educação, Freelance, Investimentos, Lazer, Moradia, Outros, Salário, Saúde, Transporte, Vestuário; RN002)
- `POST /auth/recuperar-senha {email}` → `202` sempre · `POST /auth/redefinir-senha {token, novaSenha}` → `204` (`422` token inválido/expirado)
- `POST /auth/login` `{email, senha}` → `{token, expiraEm, usuario: {id, nome, email}}` · `401` credenciais inválidas
- `GET /usuarios/me` → `{id, nome, email, possuiFoto, dataCadastro}` · `PUT /usuarios/me {nome}`
- `PUT /usuarios/me/senha {senhaAtual, novaSenha}` → `{token, expiraEm}` (via Server Action, que troca o cookie) · `422` se a senha atual estiver errada
- `GET|PUT|DELETE /usuarios/me/foto` (PUT multipart, campo `foto`)
- `GET /usuarios/me/dados` → download de `meus-dados-poupamais.json` ("Baixar meus dados" no Perfil; baixar como blob, nome do
  `Content-Disposition`). Conteúdo: `{geradoEm, perfil: {id, nome, email, dataCadastro, aceiteTermosEm, possuiFoto},
  categorias: [{id, descricao, ativa}], lancamentos: [<lançamento>, …]}`, com **todos** os lançamentos (inclusive INATIVO e DELETADO);
  sem lançamentos → `[]`. A foto não vai no JSON. Não confundir com a exportação CSV/XLSX de lançamentos (`/lancamentos/exportar`, filtrada).
- `POST /usuarios/me/excluir {senha}` → `204` (via Server Action, que apaga o cookie)
- `GET /categorias?ativa=&mes=&ano=` → `[{id, descricao, ativa, quantidadeLancamentos}]` · `POST /categorias {descricao}` → `201 {id, descricao, ativa}` (`409` duplicada) · `PUT /categorias/{id}` · `PATCH /categorias/{id}/status {ativa}` · `DELETE /categorias/{id}` (`422` se vinculada)
  - `GET` vem em ordem alfabética (sem diferenciar maiúsculas); sem filtro, **ativas primeiro**. `PUT`/`PATCH` → `200 {id, descricao, ativa}`.
    Descrição: trim, obrigatória, ≤ 255 (`400` com `erros[]`); duplicada no `PUT` → `409`; categoria de outro usuário → `404`.
  - `quantidadeLancamentos`: lançamentos ATIVO + INATIVO daquele mês (DELETADO não conta); sem `mes`/`ano`, o mês atual. `mes`/`ano` não filtram
    as categorias nem mudam a ordem; inválidos → `400` (`?mes=abc`/`?ativa=x` → `400 VALIDACAO` com `erros[]`, back #37). `POST`/`PUT`/`PATCH` não trazem a contagem.
  - No lançamento: categoria inativa → `422`; inexistente/de outro usuário → `404`.
- Lista de lançamentos ordenada por data desc, id desc; `POST`/`PUT`/`PATCH`/`restaurar` devolvem o lançamento; `DELETE` de já deletado → `422`.
- `GET /lancamentos?descricao=&mes=&ano=&tipo=&status=&categoriaId=&pagina=&tamanho=` (sem `status` = ATIVO + INATIVO; `status=DELETADO` = Lixeira)
  → `{itens: [<lançamento>], pagina, tamanho, total, totalPaginas}`. `pagina` desde 0 (padrão 0), `tamanho` 1–100 (padrão 12); fora disso → `400`.
  Filtro que não converte (`?pagina=abc`, `?tipo=XPTO`, `?status=X`) → `400 VALIDACAO` com `erros[]` por campo (back #37; vale
  também para `/lancamentos/exportar`, `GET /categorias` e `GET /dashboard`; frases logo depois da tabela de códigos, abaixo).
  "Mostrar mais" com `useInfiniteQuery`; o contador "Mostrando 12 de 30" vem de `total`. A exportação ignora a paginação.
- `GET /lancamentos/{id}` · `POST /lancamentos` · `PUT /lancamentos/{id}`, com body `{descricao, tipo, data: "2026-11-05", valor, categoriaIds, status?}`
  (`data` ISO; o front mostra dd/mm/aaaa). Dia que não existe (`2026-02-31`) ou formato errado → `400` no campo `data`; fora de 2000–2100 → `422`.
  **v1.2.0:** `status` opcional (`ATIVO`|`INATIVO`): no POST o padrão é ATIVO; no PUT, omitido, mantém; `DELETADO` → `400` no campo
  `status`. PUT de item na lixeira → `422`. O POST nasce com `dataAtualizacao: null`.
- `PATCH /lancamentos/{id}/status {status: "ATIVO"|"INATIVO"}` (`422` se DELETADO: não tira da lixeira) · `DELETE /lancamentos/{id}` →
  status DELETADO, guardando o status anterior · `POST /lancamentos/{id}/restaurar` → volta ao status anterior (sem esse dado, INATIVO);
  fora da lixeira → `422`
- `POST /lancamentos/importar` multipart, campo `arquivo` → `{totalLinhas, importados, falhas: [{linha, conteudo, motivo}], categoriasCriadas}`
- `GET /lancamentos/exportar?formato=csv|xlsx&<filtros>` → arquivo (baixar como blob, nome vindo do `Content-Disposition`)
- `GET /lancamentos/template-csv` → arquivo
- `GET /dashboard?mes=&ano=` →
  `{mes, ano, receitas, despesas, saldo, taxaGasto|null, classificacaoTaxa: "DENTRO_DO_LIMITE"|"ATENCAO"|"ACIMA_DO_LIMITE"|null, mensagem, ultimosMeses: [{mes, ano, receitas, despesas, saldo}] (4), despesasPorCategoria: [{categoriaId, descricao, valor}], maioresDespesas: [{id, descricao, data, valor, categorias: string[]}], pesoMaioresDespesas: {valor, percentual|null}}`
  (`pesoMaioresDespesas`: soma das 5 maiores e % sobre as despesas do mês, 2 casas; `percentual` `null` sem despesa).
  **v1.2.0:** `data` (`"2026-08-05"`) em cada item de `maioresDespesas`, mostrada como "1 nov" (`formatarDataCurta`) antes das categorias.

Lançamento: `{id, descricao, tipo: "RECEITA"|"DESPESA", data, valor, status: "ATIVO"|"INATIVO"|"DELETADO", categorias: [{id, descricao}], dataCadastro, dataAtualizacao, dataExclusao}`
(`data` = `"2026-11-05"`; `dataCadastro`/`dataAtualizacao`/`dataExclusao` = instantes ISO em UTC (`dataAtualizacao` `null` até a primeira alteração), ex. `"2026-08-03T09:30:15Z"`, mostrar no fuso local;
`dataExclusao` preenchida ao ir para a Lixeira e `null` ao restaurar).
**Erro (v1.2.0):** `{status, codigo, mensagem, erros?: [{campo, mensagem}]}`, ex. `{ "status": 422, "codigo": "CATEGORIA_VINCULADA",
"mensagem": "Categoria vinculada a lançamentos, apenas inative" }`. `erros[]` só vem no `400 VALIDACAO`. Exibir com
`lib/http.traduzirErro`: `mensagem` em toast/aviso e `erros` nos campos (`setError` do RHF), como vieram. O **`codigo`** é uma string
estável (MAIÚSCULAS_COM_UNDERSCORE, nunca renomeada) e fica em `ErroApi.codigo` / `RespostaErro.codigo` (opcional no tipo, porque
o BFF e o `lib/http` também montam erros sem ele: sem conexão, 404 de rota fora da lista), mas **o front não decide nada pelo
código** (decisão de 20/11): mostra a `mensagem` da API ou a genérica. **Todo erro da API sai em JSON com `codigo`, qualquer que
seja o `Accept`** (back #33, 20/11): um erro na exportação pedida com `Accept: text/csv` ou `application/octet-stream` chega com o status
e o `codigo` próprios, não como `406` vazio nem `500`. O `406` fica só para a rota que deu certo, mas produz um formato que o cliente não
aceita. Tabela completa ("Padrão de erro") no `doc/contrato-api.md` do back; resumo:

| Status | Códigos |
| --- | --- |
| 400 | `VALIDACAO` (com `erros[]`; também filtro de query que não converte em `GET /lancamentos`, `/lancamentos/exportar`, `/categorias` e `/dashboard`, back #37), `CORPO_INVALIDO`, `FORMATO_EXPORTACAO_INVALIDO`, `REQUISICAO_INVALIDA`, `PARAMETRO_INVALIDO`, `PARAMETRO_AUSENTE` |
| 401 | `NAO_AUTENTICADO` (sem token, expirado, sessão derrubada), `CREDENCIAIS_INVALIDAS` (login) |
| 403 | `ACESSO_NEGADO` (reservado) |
| 404 | `NAO_ENCONTRADO` (rota), `CATEGORIA_NAO_ENCONTRADA`, `LANCAMENTO_NAO_ENCONTRADO`, `FOTO_NAO_ENCONTRADA` |
| 405 | `METODO_NAO_PERMITIDO` |
| 406 | `TIPO_RESPOSTA_NAO_ACEITO` |
| 409 | `EMAIL_JA_CADASTRADO`, `CATEGORIA_DUPLICADA` |
| 415 | `TIPO_CONTEUDO_NAO_SUPORTADO` (antes da v1.2.0 saía 500) |
| 422 | arquivos: `ARQUIVO_GRANDE_DEMAIS` (413 se o servidor recusar antes), `ARQUIVO_VAZIO`, `ARQUIVO_INVALIDO`, `CABECALHO_INVALIDO`, `ARQUIVO_LINHAS_DEMAIS`, `SEM_DADOS_EXPORTACAO`; conta: `ACEITE_TERMOS_OBRIGATORIO`, `DADOS_CONTA_INVALIDOS`, `SENHA_ATUAL_INCORRETA`, `SENHA_IGUAL_A_ATUAL`, `SENHA_INCORRETA`, `TOKEN_INVALIDO`, `FOTO_TIPO_INVALIDO`; categorias: `CATEGORIA_INVALIDA`, `CATEGORIA_INATIVA`, `CATEGORIA_VINCULADA`; lançamentos: `LANCAMENTO_INVALIDO`, `LANCAMENTO_NA_LIXEIRA`, `LANCAMENTO_JA_EXCLUIDO`, `LANCAMENTO_NAO_EXCLUIDO`, `STATUS_INVALIDO`, `TRANSICAO_STATUS_INVALIDA` |
| 500 | `ERRO_INTERNO` (sem detalhes) |

Rota inexistente (com token) → `404` "Recurso não encontrado"; método não suportado → `405`. **Filtro de query que não
converte** (`?pagina=abc`, `?mes=abc`, `?tipo=XPTO`…) em `GET /lancamentos`, `/lancamentos/exportar`, `/categorias` e
`/dashboard` → `400 VALIDACAO` (back #37, mesmo status e código de sempre), com um item em `erros[]` por campo e a
`mensagem` em português: "Informe um número inteiro" (campo numérico), "Valor inválido. Use: RECEITA ou DESPESA" /
"Valor inválido. Use: ATIVO, INATIVO ou DELETADO" (enum) e "Valor inválido" (outros). Nos demais casos, parâmetro de
rota/query/header com tipo errado → `400 PARAMETRO_INVALIDO`; parâmetro, part ou header obrigatório ausente →
`400 PARAMETRO_AUSENTE` (os dois sem `erros[]`); `Accept` sem formato que a rota produz → `406 TIPO_RESPOSTA_NAO_ACEITO` (back #32, 20/11).
Fica fora do padrão, por decisão de 20/11: a recusa de CORS do Spring (`403` texto puro; o navegador não chama a API direto).

CSV de importação (RN012): separador `;`, cabeçalho `descricao;tipo;data;valor;categorias`, data em `dd/mm/aaaa` (dia que exista), várias categorias separadas por `|`.
A exportação CSV/XLSX acrescenta a coluna `status`; no XLSX a data é célula de data.
