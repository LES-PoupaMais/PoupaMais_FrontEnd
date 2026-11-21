import type { MetadataRoute } from 'next'

// PWA: o Next serve isto em /manifest.webmanifest. Cores = tokens do Design System (`fundo` claro e `primaria`);
// ícones do porquinho em public/icons/. Regras no CLAUDE.md, seção "PWA".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PoupaMais',
    short_name: 'PoupaMais',
    description: 'Controle financeiro pessoal: receitas, despesas e a saúde financeira do mês.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    lang: 'pt-BR',
    background_color: '#F4F6F8',
    theme_color: '#2B68D6',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
