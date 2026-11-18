import { afterEach, describe, expect, it } from 'vitest'
import { COOKIE_SIDEBAR, gravarSidebarRecolhida, lerSidebarRecolhida } from './sidebar-cookie'

describe('cookie da sidebar', () => {
  afterEach(() => {
    document.cookie = `${COOKIE_SIDEBAR}=; path=/; max-age=0`
  })

  it('sem cookie (ou expandida) a sidebar fica expandida', () => {
    expect(lerSidebarRecolhida(undefined)).toBe(false)
    expect(lerSidebarRecolhida('expandida')).toBe(false)
    expect(lerSidebarRecolhida('recolhida')).toBe(true)
  })

  it('grava a escolha no cookie', () => {
    gravarSidebarRecolhida(true)
    expect(document.cookie).toContain('sidebar=recolhida')

    gravarSidebarRecolhida(false)
    expect(document.cookie).toContain('sidebar=expandida')
  })
})
