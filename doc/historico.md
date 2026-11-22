# Histórico: estado e entregas

> Registro do que foi feito e quando (antes no `CLAUDE.md`).

## Estado atual (21/11/2026)

- **Telas prontas e integradas:** as 9 linhas da seção "Telas" (acesso, Dashboard, Lançamentos com visualização e Lixeira,
  Novo/Editar, Importar e Exportar, Categorias, Perfil, Landing, Privacidade, 404 e erro), na arquitetura
  `app/ → screens/ → components/`, com Context + View + MSW e E2E do roteiro da demo. Na integração ficou **uma versão de cada
  peça comum**: `useOnline` (conexão), `mostrarToastDesfazer` + `hooks/use-lixeira` (lixeira com Desfazer na lista, na
  visualização e no Editar), `categoria-dialog` (Categorias, folha Criar e campo do formulário), `transaction-detail`
  (visualização e Editar de item na lixeira), `useBaixarModeloCsv` (Lançamentos, Importar e vazio do Dashboard),
  `lib/baixar-arquivo` (exportar, modelo, linhas ignoradas e "Baixar meus dados"), `lib/erro-categoria` sobre `traduzirErro` e
  `lib/format.plural`.
- **Contrato v1.2.0 do back** (na development do back desde 20/11, release ainda não feita) espelhado abaixo: `status` no
  POST/PUT, restaurar ao status anterior, `codigo` em todo erro (erro sempre em JSON, com qualquer `Accept`), `data` em
  `maioresDespesas` e a rota de saúde `GET /actuator/health`.
- **Entregue em 20/11 (PRs #14 a #26):**
  - senhas fora do log do `next dev` (`logging.serverFunctions: false`);
  - suíte E2E contra a API real (`e2e/api-real`; no CI desde 21/11, job `api-real`);
  - decisões da Fase C (confirmação ao excluir categoria, sem Exportar na Lixeira, data nas maiores despesas, mensagens do
    schema iguais às do DS, textos neutros do restaurar);
  - revisão visual contra as pranchetas (área logada, parte pública, acesso e conferência final) e favicon do porquinho;
  - busca de Lançamentos 500 ms depois da última tecla, sem apagar o que se digita, e cache de 5 min nas consultas com
    invalidação central (`lib/invalidacoes.ts`);
  - "Baixar linhas ignoradas (.csv)" no resultado da importação;
  - PWA: instala como app, com consulta offline só de leitura (seção "PWA");
  - escolher o mês pelo calendário, folha Criar que fecha ao arrastar, `global-error.tsx` e prévia de categorias da Landing.
- **Entregue em 21/11:** PWA offline também nas telas abertas por link interno (seção "PWA", `VERSAO` `v3`); saída
  `standalone` do Next só quando `NEXT_OUTPUT=standalone` (imagem do modo "como produção" do PoupaMais_Development de
  ~1,15 GB para ~0,3 GB; a Vercel e o `next start` do CI continuam com o build normal); suíte `e2e/api-real` no CI (job
  "Testes contra a API real"); e-mail do encarregado (DPO) na Privacidade; textos "Mês exibido" e os da importação aprovados.
- **Próximo passo:** ensaio do roteiro da demo no modo "como produção" (HTTPS) do PoupaMais_Development e as releases (o líder
  faz). As Pendências abaixo ficam para depois, salvo decisão nova.
- Leia também o `AGENTS.md` (gerado pelo Next): o Next 16 tem mudanças grandes; a documentação da versão instalada está em
  `node_modules/next/dist/docs/`. Consulte antes de usar API do Next que você não viu neste repo.
- Entrega do código no GitHub até **26/11/2026**. Para desenvolver, o jeito mais simples é subir tudo pelo
  PoupaMais_Development (`npm run dev` lá, app em `http://localhost:8000`); sem ele, a API com `docker compose up -d --build`
  no backend e o front com `npm run dev` (`API_URL=http://localhost:8080`).
- **Deploy (21/11/2026; a decisão de 12/11 de não publicar foi revista):** front na **Vercel**
  (https://poupamais-one.vercel.app, publica a `main` a cada merge, variável `API_URL`), API no **Render**
  (https://poupamais-backend.onrender.com, Docker, plano Free que dorme sem uso; um job do cron-job.org chama
  `/actuator/health` a cada 10 min), banco no **Neon** e e-mail pelo **Brevo**. Passo a passo no README do
  PoupaMais_Development (seção "Deploy"). Cabeçalhos de segurança no `next.config.ts` (`CABECALHOS_DE_SEGURANCA`, todas as
  rotas; o HSTS é da Vercel e, no modo "como produção", do nginx, que esconde os do Next e põe os dele).
- **Saída `standalone` (21/11):** o `next.config.ts` só liga `output: 'standalone'` com `NEXT_OUTPUT=standalone`, que o
  `config/front/Dockerfile` do PoupaMais_Development define no build (imagem com `.next/standalone` + `.next/static` +
  `public`, `node server.js`, usuário `node`: de ~1,15 GB para ~0,3 GB). Sem a variável, o build é o normal: é o que a Vercel
  publica e o que o `next start` do CI e dos E2E serve (o `next start` não serve a saída standalone; o Next avisa para usar
  `node .next/standalone/server.js`). Não ligue o standalone fixo no config. Arquivo novo na raiz que o build precise entra
  na lista de `COPY` daquele Dockerfile.
