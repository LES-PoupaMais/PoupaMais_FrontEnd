import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardProvider, useDashboardContext } from './DashboardContext'
import { DashboardSkeleton } from './DashboardSkeleton'
import { DashboardView } from './DashboardView'

const rota = vi.hoisted(() => ({ busca: 'mes=11&ano=2026', replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: rota.replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(rota.busca),
}))

const renderizar = () =>
  render(
    <DashboardProvider>
      <DashboardView />
    </DashboardProvider>,
  )

describe('Dashboard (placeholder)', () => {
  beforeEach(() => {
    rota.busca = 'mes=11&ano=2026'
    rota.replace.mockClear()
  })

  it('mostra o título e o mês da URL', () => {
    renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Mês exibido' })).toHaveTextContent('Novembro 2026')
  })

  it('troca de mês escrevendo na URL, sem perder os outros parâmetros', async () => {
    rota.busca = 'mes=1&ano=2026&origem=x'
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/dashboard?mes=12&ano=2025&origem=x', { scroll: false })

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(rota.replace).toHaveBeenLastCalledWith('/dashboard?mes=2&ano=2026&origem=x', { scroll: false })
  })

  it('o esqueleto ocupa a grade e o Context exige o Provider', () => {
    const { container } = render(<DashboardSkeleton />)
    expect(container.querySelector('[data-slot="dashboard-grade"]')).not.toBeNull()

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useDashboardContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<DashboardProvider>/)
  })
})
