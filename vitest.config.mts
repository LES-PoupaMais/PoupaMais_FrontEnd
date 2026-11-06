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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/**', // páginas finas: cobertas pelo E2E (Playwright)
        'src/test/**',
        'src/**/*.d.ts',
        'src/proxy.ts', // coberto pelo E2E (e2e/protecao.spec.ts)
        // Átomos gerados pelo shadcn SEM lógica nossa (só estilo sobre o Radix): testados pelo próprio shadcn/Radix.
        // Átomo que recebeu lógica do PoupaMais (button, avatar) SAI desta lista e ganha teste.
        'src/components/atoms/badge.tsx',
        'src/components/atoms/card.tsx',
        'src/components/atoms/chart.tsx',
        'src/components/atoms/checkbox.tsx',
        'src/components/atoms/command.tsx',
        'src/components/atoms/dialog.tsx',
        'src/components/atoms/dropdown-menu.tsx',
        'src/components/atoms/field.tsx',
        'src/components/atoms/input-group.tsx',
        'src/components/atoms/input.tsx',
        'src/components/atoms/label.tsx',
        'src/components/atoms/popover.tsx',
        'src/components/atoms/select.tsx',
        'src/components/atoms/separator.tsx',
        'src/components/atoms/skeleton.tsx',
        'src/components/atoms/sonner.tsx',
        'src/components/atoms/switch.tsx',
        'src/components/atoms/table.tsx',
        'src/components/atoms/textarea.tsx',
        'src/components/atoms/tooltip.tsx',
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
