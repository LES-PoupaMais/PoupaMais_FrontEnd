// Destino depois do login (`/login?voltar=/lancamentos/novo`). Só aceita caminho interno, para não virar
// redirecionamento aberto: "/x" sim; "//site", "https://…", "/\\site", "/<tab>/site" e vazio caem no padrão.
// O `URL` do navegador apaga tab/CR/LF e troca "\" por "/" antes de ler o endereço ("/\t/site" vira "//site"),
// por isso caracteres de controle e "\" são recusados antes, e a origem é conferida depois de resolver.
const ORIGEM_INTERNA = 'http://interno.invalid'

// Caracteres de controle (C0, DEL e C1) e a barra invertida
const PROIBIDOS = /[\u0000-\u001f\u007f-\u009f\\]/

export function destinoSeguro(valor: string | string[] | undefined | null, padrao = '/dashboard'): string {
  const destino = Array.isArray(valor) ? valor[0] : valor
  if (!destino || !destino.startsWith('/') || PROIBIDOS.test(destino)) return padrao
  let url: URL
  try {
    url = new URL(destino, ORIGEM_INTERNA)
  } catch {
    return padrao
  }
  if (url.origin !== ORIGEM_INTERNA) return padrao
  const caminho = `${url.pathname}${url.search}${url.hash}`
  // Defesa extra: o resultado nunca começa com "//" (seria lido como outro site)
  return caminho.startsWith('//') ? padrao : caminho
}
