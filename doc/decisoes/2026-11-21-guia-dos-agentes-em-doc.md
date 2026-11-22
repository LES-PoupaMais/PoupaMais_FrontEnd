# Guia curto no AGENTS.md e detalhes em doc/

- Data: 2026-11-21 · Quem decidiu: líder do projeto
- Situação: aceita

## Contexto

O `CLAUDE.md` tinha cerca de 770 linhas (76 KB, perto de 19 mil tokens) e entrava inteiro no contexto de toda sessão de agente,
inclusive de cada agente paralelo. A maior parte (contrato, banco, CSV, histórico) só importa em tarefas específicas. Além
disso, só o Claude Code lê `CLAUDE.md`; outras ferramentas (Codex, opencode, Cursor, Gemini) leem `AGENTS.md`.

## Decisão

- `AGENTS.md` na raiz: guia curto, com regras que valem para toda tarefa e um índice de `doc/`.
- `CLAUDE.md` só importa o `AGENTS.md` (`@AGENTS.md`) e acrescenta o que é do Claude Code (skills e plugins). O bloco gerado pelo Next continua no topo do `AGENTS.md`.
- O detalhe foi movido sem alteração de texto para `doc/` (arquitetura, telas, design, textos aprovados, regras, contrato, PWA, testes, pendências, histórico).
- Decisões que não viram código vão para `doc/decisoes/`; troca de agente usa um `HANDOFF.md` local (fora do Git).

## Alternativas descartadas

- Manter tudo no `CLAUDE.md`: custo de tokens fixo em toda sessão e preso a uma ferramenta.
- Ferramenta externa de memória (servidor MCP): mais uma peça para manter; arquivos markdown no Git já resolvem.

## Consequências

- O agente precisa abrir o arquivo de `doc/` do assunto antes de mexer nele (o índice do `AGENTS.md` diz qual).
- Mudança de contrato: o contrato completo fica no back (`doc/contrato-api.md`); o `doc/contrato-api.md` daqui é o resumo do front e muda no mesmo PR.
