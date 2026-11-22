# Pendências e decisões que explicam diferenças com as pranchetas

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Pendências

Débito conhecido (registre aqui o que ficar de fora e tire quando resolver). Revisada em 21/11/2026: o que foi resolvido saiu;
as decisões de 20/11 e 21/11 estão nas seções de cada assunto.

1. **Infraestrutura e testes:**
   - Opcionais: `@vitest/ui` (painel visual dos testes unitários) e investigar o modo `--ui` do Playwright, que travou na subida do
     servidor.
2. **Registrar no Design System** (textos e comportamentos aprovados que ainda não estão lá):
   - Textos da seção "Textos fora do DS" (toasts, erros genéricos, frases por status, estados sem prancheta), inclusive os toasts
     de categoria e o "Baixar linhas ignoradas (.csv)" / "Linhas ignoradas baixadas" (README do ImportResult).
   - README do MoneyField: limite de R$ 999.999.999,99 (o README ainda diz R$ 99.999.999.999.999,99).
   - Restaurar volta ao status anterior: as pranchetas `lixeira-*`, `editar-lixeira-computador` e o README do TransactionDetail
     ainda dizem "volta desligado"/"voltam fora do saldo".
   - Excluir categoria pede confirmação (`ConfirmDialog` "Excluir categoria?" · "A categoria X sai da sua lista. Não dá para
     desfazer." · "Excluir categoria"), que não está na prancheta `categoria-editar-celular`; no `422` (em uso), o aviso mostra a
     `mensagem` da API no lugar da frase da prancheta `categoria-em-uso-celular`.
   - `upload-area` tem a prop opcional `onBaixarModelo` (botão com o visual do link `modeloHref`, para o modelo CSV baixar pelo
     hook com toast): registrar no README do UploadArea.
   - O DS (ImportResult/UploadArea) cita `ResultadoImportacao`/`ImportarDialog`; no código são `import-result` e a tela
     `screens/Importar`.
3. **Componentes à espera de ajuste ao DS:**
   - `confirm-dialog` usa o primitivo `AlertDialog` do Radix direto; trocar pelos componentes do átomo `alert-dialog` mantendo a
     API. O botão destrutivo usa `className` de perigo (`bg-destructive`) e `h-12` até o `button` ganhar as variantes e a altura
     de 48px do DS (o `error-state` já usa `contornado` 48px).
   - O átomo `card` ainda é o do shadcn (raio e anel antigos): as moléculas desenham a superfície do DS (`rounded-card border
     bg-card shadow-card`) com uma prop para tirar o cartão. Alinhar o `card` ao DS (`.pm-card`, `tamanho`, `destaque`) e passar
     a compor.
   - `skeleton` usa `animate-pulse` (o brilho em degradê do DS precisa de um `@keyframes` no `globals.css`).
4. **Dashboard:**
   - O "mês vazio" é deduzido de `receitas = despesas = 0`: um mês só com lançamentos fora do saldo também cai no "Comece pelo seu
     primeiro lançamento". Resolver com uma contagem de lançamentos do mês no `GET /dashboard` (decisão com o back).
   - O gráfico de área não abre a dica no mês atual por padrão (a prancheta mostra "Nov" aberto como exemplo); abre com mouse,
     toque e teclado (setas, `accessibilityLayer` do Recharts).
5. **Lançamentos, Novo/Editar e visualização:**
   - Visualização e Editar de item na lixeira mostram a auditoria na `timeline` ("Histórico"), no lugar das duas linhas "Criado
     em / Alterado em" (ou "Movido para a lixeira em") das pranchetas.
   - Sessão vencida: o login mostra o aviso, mas o formulário não guarda rascunho; a frase "Seu rascunho foi guardado" (prancheta
     e DS) só entra quando houver rascunho.
   - Os toasts de Conta no saldo e lixeira ainda se repetem nos Contexts de Lançamentos, Lixeira, visualização e formulário:
     juntar em `constants/textos` se mudarem.
6. **Categorias e Importar:**
   - Editar uma categoria **inativa** (computador) mostra só Nome e Excluir: não há prancheta de "Reativar" dentro do diálogo
     (Reativar fica na linha).
   - Importar sem `stepper`: as pranchetas `importar-*` não têm indicador de passos (escolher → importando → resultado na mesma
     tela).
7. **Perfil:**
   - `excluir-conta-dialog` compõe o `ConfirmDialog` com os campos nos `children` (não usa `confirmacaoDigitada`), porque a ajuda
     da prancheta fala também da senha. O `ConfirmDialog` não aceita `aria-describedby` no botão de confirmar nem um aviso dentro
     da descrição: o aviso "Não dá para desfazer." fica fora do `aria-describedby` do diálogo. Se o DS quiser, acrescentar essas
     duas props à molécula.
   - Sem prancheta de tablet do Perfil: a 834px fica em 1 coluna (as 2 colunas só aparecem com 420px cada, como o `auto-fit` da
     prancheta do computador).
8. **Telas de acesso e públicas:**
   - Privacidade no celular usa o topo do site (a prancheta usa a TopBar com "‹"), com "Voltar para o início" acima do título.
   - Componentes criados fora da tabela do Atomic Design: molécula `email-field`; organismos `esqueci-senha-form`,
     `esqueci-senha-enviado`, `redefinir-senha-form`, `link-expirado`, `cadastro-lateral`, `landing-hero`, `landing-beneficios`,
     `landing-passos`, `landing-dados`, `politica-privacidade`.

**Decisões que explicam diferenças com as pranchetas** (não são débito; não "corrija" sem decisão nova):

- **AuthTemplate no celular (20/11):** mantém o card central em todas as larguras (a prancheta `login-celular` não tem card). Só o
  cadastro do computador ganhou, a partir de 1024px, o topo com "Já tenho conta" (`acaoComputador`), o card sem logo com o título
  à esquerda e o subtítulo "Só nome, e-mail e senha." (`subtituloComLateral`).
- **Links de texto sublinhados (20/11, WCAG 1.4.1):** links dentro de frase e links soltos das telas públicas e de acesso levam
  `underline`. Botões e links de navegação ficam sem, como nas pranchetas.
- **Lixeira sem Exportar (20/11):** Exportar fica só em Lançamentos; a dica do diálogo diz "A lixeira fica de fora.".
- **Exportar** é um diálogo (tela cheia no celular, card de 640px no computador) com o conteúdo das pranchetas `exportar-*`, que
  desenham uma página.
- **`useHidratado`** (`hooks/use-hidratado.ts`): `false` no servidor e na hidratação. O tema do Perfil e o `useUsuario` usam: na
  hidratação o `useUsuario` devolve "carregando", igual ao HTML do servidor (sem isso, erro #418 no Dashboard e no Perfil).
- **E2E das Server Actions:** o `playwright.config.ts` sobe a API falsa `e2e/api-falsa.mjs` na porta `PORT + 1000` (rotas
  `/api/auth/*`, troca de senha e excluir conta) e passa `API_URL` para o Next.
