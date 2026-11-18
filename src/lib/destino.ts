// Destino depois do login (`/login?voltar=/lancamentos/novo`). Só aceita caminho interno, para não virar
// redirecionamento aberto: "/x" sim; "//site", "https://…", "/\\site" e vazio caem no padrão.
export function destinoSeguro(valor: string | string[] | undefined | null, padrao = '/dashboard'): string {
  const destino = Array.isArray(valor) ? valor[0] : valor
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) return padrao
  return destino
}
