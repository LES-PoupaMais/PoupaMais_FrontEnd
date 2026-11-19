import type { NextConfig } from 'next'

// Só no `next dev`: endereços além de localhost que podem carregar os scripts de desenvolvimento
// (ex.: abrir pelo celular na mesma rede, `ORIGENS_DEV_PERMITIDAS=192.168.0.10`). Separados por vírgula.
const origensDevPermitidas = (process.env.ORIGENS_DEV_PERMITIDAS ?? '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins: origensDevPermitidas,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
