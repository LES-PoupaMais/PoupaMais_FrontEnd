import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { formatarTamanho, UploadArea, type UploadAreaProps } from './upload-area'

const csv = (nome = 'lancamentos-novembro-2026.csv', bytes = 48 * 1024, tipo = 'text/csv') =>
  new File([new Uint8Array(bytes)], nome, { type: tipo })

function Controlado(props: Partial<UploadAreaProps>) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  return (
    <UploadArea
      modeloHref="/api/lancamentos/template-csv"
      {...props}
      arquivo={arquivo}
      onEscolher={(a) => {
        setArquivo(a)
        props.onEscolher?.(a)
      }}
      onRemover={() => setArquivo(null)}
    />
  )
}

const campoArquivo = () => screen.getByLabelText('Escolher arquivo')

describe('UploadArea', () => {
  it('vazio: ajuda ligada ao campo de arquivo e link do modelo', () => {
    render(<Controlado />)

    expect(screen.getByText('Arraste o arquivo CSV para cá')).toBeInTheDocument()
    expect(campoArquivo()).toHaveAttribute('accept', '.csv,text/csv')
    expect(campoArquivo()).toHaveAccessibleDescription(/Até 2 MB/)
    expect(screen.getByRole('link', { name: 'Baixar modelo CSV' })).toHaveAttribute(
      'href',
      '/api/lancamentos/template-csv',
    )
  })

  it('escolhe um CSV válido e mostra nome, tamanho e remover', async () => {
    const aoEscolher = vi.fn()
    render(<Controlado onEscolher={aoEscolher} />)

    await userEvent.upload(campoArquivo(), csv())

    expect(aoEscolher).toHaveBeenCalledOnce()
    expect(screen.getByText('lancamentos-novembro-2026.csv')).toBeInTheDocument()
    expect(screen.getByText('48 KB')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover arquivo lancamentos-novembro-2026.csv' }))
    expect(screen.getByText('Arraste o arquivo CSV para cá')).toBeInTheDocument()
  })

  it('recusa outro tipo com a mensagem do DS', async () => {
    const aoErro = vi.fn()
    const aoEscolher = vi.fn()
    render(<Controlado onErro={aoErro} onEscolher={aoEscolher} />)

    await userEvent.upload(campoArquivo(), csv('extrato-banco.pdf', 100, 'application/pdf'), { applyAccept: false })

    const mensagem = '"extrato-banco.pdf" não é um arquivo CSV. Envie um arquivo .csv.'
    expect(screen.getByRole('alert')).toHaveTextContent(mensagem)
    expect(aoErro).toHaveBeenCalledWith(mensagem)
    expect(aoEscolher).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Escolher outro arquivo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Baixar modelo CSV' })).toBeInTheDocument()
  })

  it('recusa acima do limite (2 MB por padrão)', async () => {
    render(<Controlado />)

    await userEvent.upload(campoArquivo(), csv('grande.csv', 3.4 * 1024 * 1024))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O arquivo tem 3,4 MB. O limite é 2 MB: divida em arquivos menores.',
    )
  })

  it('o limite e os tipos vêm por props (ex.: imagem)', async () => {
    const aoEscolher = vi.fn()
    render(
      <Controlado
        accept="image/*"
        maxBytes={1024 * 1024}
        nomeDoTipo="de imagem"
        titulo="Arraste a imagem para cá"
        onEscolher={aoEscolher}
      />,
    )

    await userEvent.upload(campoArquivo(), csv('foto.png', 1000, 'image/png'))
    expect(aoEscolher).toHaveBeenCalledOnce()
  })

  it('arrastar mostra "Solte para enviar" e soltar escolhe o arquivo', () => {
    const aoEscolher = vi.fn()
    render(<Controlado onEscolher={aoEscolher} />)
    const area = screen.getByText('Arraste o arquivo CSV para cá').closest('[data-slot="upload-area"]') as HTMLElement

    fireEvent.dragEnter(area)
    expect(screen.getByText('Solte para enviar')).toBeInTheDocument()
    fireEvent.dragLeave(area, { relatedTarget: document.body })
    expect(screen.getByText('Arraste o arquivo CSV para cá')).toBeInTheDocument()

    fireEvent.dragOver(area)
    const soltar = createEvent.drop(area)
    Object.defineProperty(soltar, 'dataTransfer', { value: { files: [csv()] } })
    fireEvent(area, soltar)

    expect(aoEscolher).toHaveBeenCalledOnce()
  })

  it('mostra o erro de fora e, desabilitada, não aceita arquivo', async () => {
    const aoEscolher = vi.fn()
    render(<Controlado erro="Não foi possível importar. Tentar de novo" disabled onEscolher={aoEscolher} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível importar. Tentar de novo')
    expect(screen.getByLabelText('Escolher outro arquivo')).toBeDisabled()
  })

  it('formata o tamanho', () => {
    expect(formatarTamanho(100)).toBe('1 KB')
    expect(formatarTamanho(2 * 1024 * 1024)).toBe('2 MB')
  })
})
