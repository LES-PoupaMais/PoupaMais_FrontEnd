// Rotas que o BFF (app/api/[...path]/route.ts) repassa para a API. Só o que o client usa de verdade (services/):
// lancamentos/*, categorias/*, dashboard, usuarios/me (perfil), usuarios/me/foto e usuarios/me/dados, e a recuperação
// de senha (auth/recuperar-senha e auth/redefinir-senha, rotas públicas que não mexem no cookie).
// Fica de fora (404) o que é Server Action: auth/login, auth/cadastro e qualquer outro auth/*, usuarios/me/senha e
// usuarios/me/excluir. Rota nova no services/ → acrescente aqui (e no teste).

/** Caminho exato (`exato`) ou o prefixo e tudo abaixo dele */
const PERMITIDAS: { caminho: string; exato?: boolean }[] = [
  { caminho: 'lancamentos' },
  { caminho: 'categorias' },
  { caminho: 'dashboard', exato: true },
  { caminho: 'usuarios/me', exato: true },
  { caminho: 'usuarios/me/foto', exato: true },
  { caminho: 'usuarios/me/dados', exato: true },
  { caminho: 'auth/recuperar-senha', exato: true },
  { caminho: 'auth/redefinir-senha', exato: true },
]

/** Decodifica até não mudar mais (pega "%2e%2e" e "%252e%252e"); `null` se a codificação for inválida */
function decodificado(segmento: string): string | null {
  let atual = segmento
  for (let i = 0; i < 5; i += 1) {
    let proximo: string
    try {
      proximo = decodeURIComponent(atual)
    } catch {
      return null
    }
    if (proximo === atual) return atual
    atual = proximo
  }
  return null
}

/**
 * Caminho a repassar (`lancamentos/3/status`, já codificado) ou `null` (o BFF responde 404).
 * Recusa segmento vazio, "." e "..", inclusive codificados, e barra dentro do segmento.
 */
export function caminhoDoBff(segmentos: readonly string[]): string | null {
  if (segmentos.length === 0) return null
  const limpos: string[] = []
  for (const segmento of segmentos) {
    const valor = decodificado(segmento)
    if (valor === null || valor === '' || valor === '.' || valor === '..' || /[/\\]/.test(valor)) return null
    limpos.push(valor)
  }
  const caminho = limpos.join('/')
  const permitida = PERMITIDAS.some(({ caminho: base, exato }) =>
    exato ? caminho === base : caminho === base || caminho.startsWith(`${base}/`),
  )
  return permitida ? limpos.map(encodeURIComponent).join('/') : null
}
