import { createCn } from 'cn/config'

// Junta classes condicionais e resolve conflitos do Tailwind (a última vence).
// Implementação: pacote oficial do shadcn (`cn`), substituto de clsx + tailwind-merge.
// Os átomos gerados pela CLI do shadcn importam `cn` direto do pacote; padronizamos o import por aqui (@/lib/cn).
//
// Os tokens próprios do globals.css precisam ser ensinados ao merge; sem isso `text-titulo-1` seria lido como COR
// e `cn('text-receita', 'text-valor-tile')` apagaria uma das duas. Novo token de tamanho, sombra ou medida? Inclua aqui.
export const ESTILOS_DE_TEXTO = [
  'display',
  'titulo-1',
  'titulo-2',
  'titulo-3',
  'rotulo-secao',
  'corpo',
  'corpo-forte',
  'legenda',
  'rotulo-campo',
  'mini',
  'valor-destaque',
  'valor-tile',
  'valor-linha',
] as const

export const cn = createCn({
  extend: {
    theme: {
      spacing: ['sidebar', 'trilho', 'barra-inferior'],
      container: ['conteudo'],
      shadow: ['card', 'flutuante'],
      radius: ['campo', 'icone', 'card', 'grande', 'pilula'],
    },
    classGroups: {
      'font-size': [{ text: [...ESTILOS_DE_TEXTO] }],
    },
  },
})
