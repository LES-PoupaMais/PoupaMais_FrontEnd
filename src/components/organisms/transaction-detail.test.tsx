import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Lancamento } from '@/types/api'
import {
  AVISO_LIXEIRA,
  TransactionDetail,
  TransactionDetailPanel,
  TransactionDetailSkeleton,
  eventosDaAuditoria,
} from './transaction-detail'

const mercado: Lancamento = {
  id: 3,
  descricao: 'Mercado do mês',
  tipo: 'DESPESA',
  data: '2026-11-05',
  valor: 1120.35,
  status: 'ATIVO',
  categorias: [{ id: 2, descricao: 'Mercado' }],
  dataCadastro: '2026-11-05T22:42:00Z',
  dataAtualizacao: '2026-11-06T11:15:00Z',
  dataExclusao: null,
}

describe('TransactionDetail', () => {
  it('dados, data por extenso, Conta no saldo "Sim" e histórico do mais recente para o mais antigo', () => {
    render(<TransactionDetail lancamento={mercado} nivelTitulo="h1" hrefEditar="/lancamentos/3/editar" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Mercado do mês' })).toBeInTheDocument()
    expect(screen.getByText('5 de novembro de 2026')).toHaveAttribute('datetime', '2026-11-05')
    expect(screen.getByRole('switch', { name: 'Conta no saldo' })).toBeChecked()
    expect(screen.getByText('Sim')).toBeInTheDocument()
    const historico = screen.getByRole('list', { name: /Histórico/ })
    expect(
      within(historico)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('p')?.textContent),
    ).toEqual(['Alterado', 'Criado'])
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/lancamentos/3/editar')
  })

  it('alterna o saldo e move para a lixeira', async () => {
    const onAlternarSaldo = vi.fn()
    const onMoverParaLixeira = vi.fn()
    render(
      <TransactionDetail
        lancamento={{ ...mercado, status: 'INATIVO' }}
        onAlternarSaldo={onAlternarSaldo}
        onMoverParaLixeira={onMoverParaLixeira}
      />,
    )
    expect(screen.getByText('Não')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: 'Conta no saldo' }))
    expect(onAlternarSaldo).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a lixeira' }))
    expect(onMoverParaLixeira).toHaveBeenCalled()
  })

  it('sem internet: o que grava fica desabilitado', async () => {
    const onMoverParaLixeira = vi.fn()
    render(<TransactionDetail lancamento={mercado} onMoverParaLixeira={onMoverParaLixeira} motivoDesabilitado="m" />)
    expect(screen.getByRole('switch', { name: 'Conta no saldo' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a lixeira' }))
    expect(onMoverParaLixeira).not.toHaveBeenCalled()
  })

  it('na lixeira: aviso, selo, sem switch e sem Editar, com Restaurar e "Movido para a lixeira" no histórico', async () => {
    const onRestaurar = vi.fn()
    render(
      <TransactionDetail
        lancamento={{ ...mercado, status: 'DELETADO', dataExclusao: '2026-11-16T12:20:00Z' }}
        hrefEditar="/x"
        onRestaurar={onRestaurar}
        acaoExtra={<a href="/lixeira">Ver a lixeira</a>}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(AVISO_LIXEIRA)
    expect(screen.getByText('Na lixeira')).toBeInTheDocument()
    expect(screen.getByText('Não · volta desligado ao restaurar')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.getByText('Movido para a lixeira')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(onRestaurar).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Ver a lixeira' })).toBeInTheDocument()
  })

  it('eventosDaAuditoria: sem "Alterado" quando nunca mudou', () => {
    const eventos = eventosDaAuditoria({ ...mercado, dataAtualizacao: mercado.dataCadastro })
    expect(eventos.map((e) => e.titulo)).toEqual(['Criado'])
  })

  it('painel: diálogo "Lançamento" que fecha pelo ×', async () => {
    const onFechar = vi.fn()
    render(
      <TransactionDetailPanel aberto onFechar={onFechar}>
        <TransactionDetailSkeleton />
      </TransactionDetailPanel>,
    )
    expect(screen.getByRole('dialog', { name: 'Lançamento' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onFechar).toHaveBeenCalled()
  })
})
