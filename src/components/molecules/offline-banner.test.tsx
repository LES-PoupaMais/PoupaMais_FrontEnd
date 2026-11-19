import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfflineBanner, OfflineMotivo } from './offline-banner'

describe('OfflineBanner', () => {
  it('anuncia a falta de internet de forma educada', () => {
    render(<OfflineBanner />)
    const faixa = screen.getByRole('status')
    expect(faixa).toHaveAttribute('aria-live', 'polite')
    expect(faixa).toHaveTextContent('Sem internet agora. Você pode continuar vendo, mas não dá para salvar.')
  })

  it('o motivo descreve o botão desabilitado', () => {
    render(
      <>
        <OfflineBanner variante="canto" />
        <button type="button" aria-disabled="true" aria-describedby="motivo">
          Salvar lançamento
        </button>
        <OfflineMotivo id="motivo" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Salvar lançamento' })).toHaveAccessibleDescription(
      'Sem internet. O que você preencheu fica aqui até a conexão voltar.',
    )
  })
})
