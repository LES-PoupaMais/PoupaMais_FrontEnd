import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true }, // alias @/* do tsconfig.json
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Metade dos núcleos: com a máquina ocupada (outros testes, build, Docker), usar todos os núcleos fazia testes
    // de tela passarem do timeout de 5 s sem bug nenhum. Sobrescreva na linha de comando com --maxWorkers=<n>.
    maxWorkers: '50%',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Entram: components/, screens/ (Context + View, testados juntos com MSW), hooks/, services/, schemas/, lib/…
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/**', // só rotas (Provider + View): cobertas pelo E2E (Playwright)
        'src/styles/**', // globals.css e next/font: não rodam no Vitest
        'src/**/index.ts', // reexports públicos das telas (screens/<Tela>/index.ts)
        'src/test/**',
        'src/**/*.d.ts',
        'src/proxy.ts', // coberto pelo E2E (e2e/protecao.spec.ts)
        // Átomos gerados pelo shadcn SEM lógica nossa (só estilo sobre o Radix): testados pelo próprio shadcn/Radix.
        // Átomo alterado pelo PoupaMais (button, avatar, input, checkbox, dialog, calendar, badge, tooltip…) SAI desta lista e ganha teste.
        'src/components/atoms/card.tsx',
        'src/components/atoms/chart.tsx',
        'src/components/atoms/command.tsx',
        'src/components/atoms/dropdown-menu.tsx',
        'src/components/atoms/field.tsx',
        'src/components/atoms/input-group.tsx',
        'src/components/atoms/separator.tsx',
        'src/components/atoms/sonner.tsx',
        'src/components/atoms/table.tsx',
      ],
      // Pisos de cobertura: o PR reprova abaixo deles. Subir junto quando a cobertura subir.
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})
