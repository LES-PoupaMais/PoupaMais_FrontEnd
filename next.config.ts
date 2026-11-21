import type { NextConfig } from 'next'

// Só no `next dev`: endereços além de localhost que podem carregar os scripts de desenvolvimento
// (ex.: abrir pelo celular na mesma rede, `ORIGENS_DEV_PERMITIDAS=192.168.0.10`). Separados por vírgula.
const origensDevPermitidas = (process.env.ORIGENS_DEV_PERMITIDAS ?? '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins: origensDevPermitidas,
  // Só no `next dev`: o Next 16 registra cada chamada de Server Function com os ARGUMENTOS
  // (`└─ ƒ loginAction({"email":…,"senha":"…"})`), o que deixava senhas de login, cadastro, troca de senha e exclusão de
  // conta em texto no terminal. Desligamos só esse registro; o de requisições (`POST /login 200 in …`), o de `fetch` e os
  // erros continuam. Documentação: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md
  logging: {
    serverFunctions: false,
  },
  // PWA: o navegador sempre confere se há versão nova do service worker (public/sw.js)
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
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
