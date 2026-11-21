// Preferência da sidebar no computador (DS: Sidebar). Lida no servidor (screens/AppShell) para a página já chegar
// no modo certo, e gravada no navegador ao alternar. Sem cookie = expandida.
export const COOKIE_SIDEBAR = 'sidebar'
const UM_ANO = 60 * 60 * 24 * 365

export function lerSidebarRecolhida(valor: string | undefined): boolean {
  return valor === 'recolhida'
}

export function gravarSidebarRecolhida(recolhida: boolean): void {
  document.cookie = `${COOKIE_SIDEBAR}=${recolhida ? 'recolhida' : 'expandida'}; path=/; max-age=${UM_ANO}; samesite=lax`
}
