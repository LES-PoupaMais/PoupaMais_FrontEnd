import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'

// Arquitetura (CLAUDE.md, seção "Arquitetura"): cada pasta é um "elemento" e as policies dizem quem pode importar quem.
// Tudo o que não está liberado é proibido (default: 'disallow'). Testes e src/test ficam de fora.
// A ordem importa: o primeiro padrão que casa decide o tipo (por isso `bff` vem antes de `app`).
const elementos = [
  { type: 'atom', pattern: 'src/components/atoms' },
  { type: 'molecule', pattern: 'src/components/molecules' },
  { type: 'organism', pattern: 'src/components/organisms' },
  { type: 'template', pattern: 'src/components/templates' },
  // uma pasta por tela: `tela` guarda o nome, para impedir que uma tela importe outra
  { type: 'screen', pattern: 'src/screens/*', capture: ['tela'] },
  { type: 'bff', pattern: 'src/app/api' },
  { type: 'app', pattern: 'src/app' },
  { type: 'styles', pattern: 'src/styles' },
  { type: 'hooks', pattern: 'src/hooks' },
  { type: 'services', pattern: 'src/services' },
  { type: 'actions', pattern: 'src/actions' },
  { type: 'schemas', pattern: 'src/schemas' },
  { type: 'types', pattern: 'src/types' },
  { type: 'constants', pattern: 'src/constants' },
  { type: 'lib', pattern: 'src/lib' },
]

const pode = (from, ...to) => ({ from: { element: { type: from } }, allow: { to: { element: { types: to } } } })

const arquitetura = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
  plugins: { boundaries },
  settings: { 'boundaries/elements': elementos },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        message:
          'Arquitetura: "{{ from.element.types.[0] }}" não pode importar "{{ to.element.types.[0] }}". Ver CLAUDE.md, seção Arquitetura.',
        policies: [
          // components/: UI pura. Organismos NÃO usam hooks/, services/ nem actions/ (recebem dados e callbacks por props)
          pode('atom', 'atom', 'lib', 'types'),
          pode('molecule', 'atom', 'molecule', 'lib', 'types'),
          pode('organism', 'atom', 'molecule', 'organism', 'schemas', 'types', 'constants', 'lib'),
          pode('template', 'atom', 'molecule', 'organism', 'template', 'lib', 'types'),
          // screens/: Context (dados, estado, ações) + View (Template + Organisms)
          pode(
            'screen',
            'atom',
            'molecule',
            'organism',
            'template',
            'hooks',
            'actions',
            'schemas',
            'types',
            'constants',
            'lib',
          ),
          // ...e arquivos da PRÓPRIA tela; uma tela não importa outra
          {
            from: { element: { type: 'screen' } },
            allow: { to: { element: { type: 'screen', captured: { tela: '{{ from.element.captured.tela }}' } } } },
          },
          // app/: só rotas. Importa telas e tipos (e os estilos globais, no layout raiz)
          pode('app', 'screen', 'styles', 'types'),
          // app/api: o BFF (route handler, sem UI) lê o cookie da sessão
          pode('bff', 'lib', 'types', 'constants'),
          pode('styles', 'styles'),
          pode('hooks', 'hooks', 'services', 'schemas', 'types', 'constants', 'lib'),
          pode('services', 'services', 'types', 'constants', 'lib'),
          pode('actions', 'actions', 'schemas', 'types', 'constants', 'lib'),
          pode('schemas', 'schemas', 'types', 'constants', 'lib'),
          pode('constants', 'constants', 'types'),
          pode('types', 'types'),
          pode('lib', 'lib', 'types', 'constants'),
        ],
      },
    ],
  },
}

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  arquitetura,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'playwright-report/**',
    'playwright-report-api-real/**',
    'test-results/**',
  ]),
])
