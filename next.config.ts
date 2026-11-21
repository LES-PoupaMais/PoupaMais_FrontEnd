import type { NextConfig } from 'next'

// Só no `next dev`: endereços além de localhost que podem carregar os scripts de desenvolvimento
// (ex.: abrir pelo celular na mesma rede, `ORIGENS_DEV_PERMITIDAS=192.168.0.10`). Separados por vírgula.
const origensDevPermitidas = (process.env.ORIGENS_DEV_PERMITIDAS ?? '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean)

/** nosniff: o navegador não "adivinha" o tipo do arquivo; DENY: ninguém abre o app dentro de um iframe (clickjacking) */
export const CABECALHOS_DE_SEGURANCA = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: origensDevPermitidas,
  // Só no `next dev`: o Next 16 registra cada chamada de Server Function com os ARGUMENTOS
  // (`└─ ƒ loginAction({"email":…,"senha":"…"})`), o que deixava senhas de login, cadastro, troca de senha e exclusão de
  // conta em texto no terminal. Desligamos só esse registro; o de requisições (`POST /login 200 in …`), o de `fetch` e os
  // erros continuam. Documentação: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md
  logging: {
    serverFunctions: false,
  },
  async headers() {
    return [
      // Cabeçalhos de segurança em todas as respostas. Na Vercel não há nginx na frente (o HSTS ela já manda); no modo
      // "como produção" do PoupaMais_Development o nginx esconde estes e põe os dele, para não sair repetido.
      { source: '/:path*', headers: CABECALHOS_DE_SEGURANCA },
      // PWA: o navegador sempre confere se há versão nova do service worker (public/sw.js)
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
