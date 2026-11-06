---
name: pipeline-local
description: Use antes de dizer que uma tarefa do frontend do PoupaMais terminou, antes de commitar ou abrir PR, ou quando o CI do GitHub Actions falhar. Roda localmente os mesmos passos da pipeline (.github/workflows/ci.yml), incluindo os testes end-to-end.
---

# Pipeline local do frontend

Mesmos passos do `.github/workflows/ci.yml`, na mesma ordem (use `nvm use` antes):

```bash
npm ci                      # só se o package-lock mudou
npm run lint                # 1. ESLint (inclui as regras do Atomic Design)
npm run format:check        # 2. Prettier (corrigir com npm run format)
npm run typecheck           # 3. TypeScript sem emitir
npm run test:coverage       # 4. Vitest + piso de cobertura
npm run build               # 5. build de produção do Next
npm run test:e2e            # 6. Playwright (instale os navegadores 1x: npx playwright install --with-deps chromium firefox)
```

- Lint de `boundaries/element-types`: um componente importou um nível acima ou um hook fora de organismo (skill `componente-atomic`).
- Cobertura abaixo do piso: veja `coverage/index.html` e escreva os testes que faltam.
- E2E falhou: `npx playwright show-report` mostra o passo, o print e o trace.

Só relate "pronto" com tudo verde. Se algo não rodou por motivo externo, diga exatamente o quê.
