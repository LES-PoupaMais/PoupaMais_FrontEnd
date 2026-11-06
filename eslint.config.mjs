import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'

// Atomic Design: cada pasta é um "elemento" (arquivos kebab-case soltos dentro dela, padrão shadcn);
// as policies dizem quem pode importar quem.
// Mesmo nível é permitido (ex.: um átomo usar o Spinner). Importar um nível ACIMA é erro.
const elementos = [
  { type: 'atom', pattern: 'src/components/atoms' },
  { type: 'molecule', pattern: 'src/components/molecules' },
  { type: 'organism', pattern: 'src/components/organisms' },
  { type: 'template', pattern: 'src/components/templates' },
  { type: 'app', pattern: 'src/app' },
  { type: 'hooks', pattern: 'src/hooks' },
  { type: 'services', pattern: 'src/services' },
  { type: 'actions', pattern: 'src/actions' },
  { type: 'schemas', pattern: 'src/schemas' },
  { type: 'types', pattern: 'src/types' },
  { type: 'constants', pattern: 'src/constants' },
  { type: 'lib', pattern: 'src/lib' },
]

const pode = (from, ...to) => ({ from: { element: { type: from } }, allow: { to: { element: { types: to } } } })

const atomicDesign = {
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
          'Atomic Design: "{{ from.element.types.[0] }}" não pode importar "{{ to.element.types.[0] }}". Ver CLAUDE.md, seção Atomic Design.',
        policies: [
          pode('atom', 'atom', 'lib', 'types'),
          pode('molecule', 'atom', 'molecule', 'lib', 'types'),
          pode(
            'organism',
            'atom',
            'molecule',
            'organism',
            'hooks',
            'schemas',
            'types',
            'constants',
            'lib',
            'actions',
            'services',
          ),
          pode('template', 'atom', 'molecule', 'organism', 'template', 'lib', 'types'),
          pode(
            'app',
            'atom',
            'molecule',
            'organism',
            'template',
            'app',
            'hooks',
            'actions',
            'types',
            'constants',
            'lib',
          ),
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
  atomicDesign,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
])
