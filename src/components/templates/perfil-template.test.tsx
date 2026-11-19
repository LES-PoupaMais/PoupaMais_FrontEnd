import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PerfilTemplate } from './perfil-template'

describe('PerfilTemplate', () => {
  it('põe cabeçalho, aviso, as duas colunas e o rodapé nessa ordem', () => {
    const { container } = render(
      <PerfilTemplate
        cabecalho={<h1>Perfil</h1>}
        aviso={<p>aviso</p>}
        principal={<p>foto</p>}
        lateral={<p>tema</p>}
        rodape={<button>Sair da conta</button>}
      />,
    )
    const ordem = [...container.querySelectorAll('[data-slot]')].map((el) => el.getAttribute('data-slot'))
    expect(ordem).toEqual([
      'perfil-template',
      'perfil-cabecalho',
      'perfil-aviso',
      'perfil-colunas',
      'perfil-principal',
      'perfil-lateral',
      'perfil-rodape',
    ])
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
  })

  it('o estado (erro) substitui as colunas', () => {
    const { container } = render(<PerfilTemplate estado={<p>erro</p>} principal={<p>foto</p>} />)
    expect(screen.getByText('erro')).toBeInTheDocument()
    expect(screen.queryByText('foto')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="perfil-colunas"]')).toBeNull()
  })
})
