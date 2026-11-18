import { render, screen } from '@testing-library/react'
import { ArrowUpRight } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Badge } from '@/components/atoms/badge'
import { StatCard, StatCardGrade } from './stat-card'

describe('StatCard', () => {
  it('mostra rótulo, valor e rodapé numa grade acessível', () => {
    render(
      <StatCardGrade aria-label="Resumo de novembro de 2026" computador>
        <StatCard funcao="receita" icone={ArrowUpRight} rotulo="Receitas" valor="R$ 12.480,50" />
        <StatCard rotulo="Taxa de gasto" valor="60,6%" rodape={<Badge variant="receita">Dentro do limite</Badge>} />
      </StatCardGrade>,
    )
    const grade = screen.getByRole('list', { name: 'Resumo de novembro de 2026' })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(grade).toHaveTextContent('Receitas')
    expect(screen.getByText('R$ 12.480,50')).toBeInTheDocument()
    expect(screen.getByText('Dentro do limite')).toBeInTheDocument()
  })

  it('valor indisponível vira "—" com o motivo', () => {
    render(<StatCard rotulo="Taxa de gasto" valor={null} />)
    expect(screen.getByText('Sem valor')).toBeInTheDocument()
    expect(screen.getByText('Não disponível para o período')).toBeInTheDocument()
  })

  it('carregando mostra o esqueleto e avisa o leitor de tela', () => {
    render(
      <StatCardGrade aria-label="Resumo" carregando>
        <StatCard rotulo="Receitas" valor="R$ 1,00" carregando />
      </StatCardGrade>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o resumo do mês…')
    expect(screen.getByRole('list', { name: 'Resumo' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Receitas')).not.toBeInTheDocument()
  })
})
