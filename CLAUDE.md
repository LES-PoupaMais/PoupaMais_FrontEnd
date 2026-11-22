@AGENTS.md

## Só para o Claude Code: skills e plugins

O guia do projeto é o `AGENTS.md` (importado acima), que vale para qualquer IA. Aqui fica só o que é do Claude Code.

| Skill (`.claude/skills/`) | Quando |
|---|---|
| `componente-atomic` | Criar ou alterar componente (nível, arquivo, imports, pureza, teste) |
| `tela-next` | Criar ou alterar uma tela/rota: fluxo de 4 etapas (componentes → Context → View → rota) |
| `testes-frontend` | Escrever ou corrigir testes (Vitest, MSW, Playwright); cobertura reprovando |
| `pipeline-local` | Antes de dizer "pronto", commitar ou abrir PR; CI falhou |
| `mudanca-de-regra` (na raiz do workspace) | O pedido contradiz o DVP, o Design System ou o contrato |

Plugins recomendados (`/plugin`): `playwright` (navegar na app e depurar E2E), `feature-dev`, `pr-review-toolkit`, `commit-commands`,
`security-guidance`, `context7` (documentação atualizada de Next/React/Tailwind).
