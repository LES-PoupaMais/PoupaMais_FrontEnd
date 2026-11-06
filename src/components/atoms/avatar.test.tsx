import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvatarBadge, AvatarGroup, AvatarGroupCount, AvatarUsuario, inicialDoNome } from './avatar'

// O Radix só mostra a <img> depois que ela carrega; o jsdom não carrega imagens.
// Este Image falso dispara "load" assim que recebe o src.
class ImagemQueCarrega extends EventTarget {
  onload: (() => void) | null = null
  complete = false
  naturalWidth = 0
  referrerPolicy = ''
  crossOrigin: string | null = null
  set src(_valor: string) {
    queueMicrotask(() => {
      this.complete = true
      this.naturalWidth = 64
      this.onload?.()
      this.dispatchEvent(new Event('load'))
    })
  }
}

describe('AvatarUsuario', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem foto, mostra a primeira letra do nome em maiúscula', () => {
    render(<AvatarUsuario nome="leonardo hideki" />)

    expect(screen.getByRole('img', { name: 'Avatar de leonardo hideki' })).toHaveTextContent('L')
  })

  it('mostra a foto quando ela carrega', async () => {
    vi.stubGlobal('Image', ImagemQueCarrega)

    render(<AvatarUsuario nome="Thalia Soares" fotoUrl="/api/usuarios/me/foto?v=2" />)

    expect(await screen.findByRole('img', { name: 'Foto de Thalia Soares' })).toHaveAttribute(
      'src',
      '/api/usuarios/me/foto?v=2',
    )
  })

  it('trata nome com espaços, acento e nome vazio', () => {
    expect(inicialDoNome('  érica')).toBe('É')
    expect(inicialDoNome('   ')).toBe('?')
  })

  it('agrupa avatares com contador e selo (partes do shadcn)', () => {
    render(
      <AvatarGroup>
        <AvatarUsuario nome="Bruno" />
        <AvatarGroupCount>+3</AvatarGroupCount>
        <AvatarBadge aria-label="online" />
      </AvatarGroup>,
    )

    expect(screen.getByText('+3')).toBeInTheDocument()
    expect(screen.getByLabelText('online')).toBeInTheDocument()
  })
})
