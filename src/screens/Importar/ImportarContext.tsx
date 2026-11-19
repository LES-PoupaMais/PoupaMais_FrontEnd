'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { TOAST_MODELO_CSV, useBaixarModeloCsv } from '@/hooks/use-exportacao'
import { useImportarCsv } from '@/hooks/use-importacao'
import { useOnline } from '@/hooks/use-online'
import { plural } from '@/lib/format'
import { traduzirErro } from '@/lib/http'
import type { ResultadoImportacao } from '@/types/api'

// Importar CSV (RN007/RN012): escolher o arquivo (a UploadArea confere tipo e 2 MB antes de enviar), importar e mostrar
// o resultado. A mutation invalida lista, dashboard e categorias.

type Importado = { resultado: ResultadoImportacao; nomeArquivo: string; em: Date }

type ImportarContextValue = {
  arquivo: File | null
  escolher: (arquivo: File) => void
  remover: () => void
  /** Erro da área de envio (tipo, tamanho ou recusa da API) */
  erroArquivo: string | null
  setErroArquivo: (mensagem: string | null) => void
  importar: () => void
  importando: boolean
  importado: Importado | null
  importarOutro: () => void
  online: boolean
  /** "Baixar modelo CSV" (nome do arquivo vem do Content-Disposition) */
  baixarModelo: () => void
}

const ImportarContext = createContext<ImportarContextValue | null>(null)

export function ImportarProvider({ children }: { children: ReactNode }) {
  const importacao = useImportarCsv()
  const online = useOnline()
  const modelo = useBaixarModeloCsv()
  const baixarModelo = () =>
    modelo.mutate(undefined, {
      onSuccess: () => toast.success(TOAST_MODELO_CSV.sucesso),
      onError: (erro) => toast.error(traduzirErro(erro, { padrao: TOAST_MODELO_CSV.erro }).mensagem),
    })
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [importado, setImportado] = useState<Importado | null>(null)

  const importar = () => {
    if (!arquivo || !online || importacao.isPending) return
    const nomeArquivo = arquivo.name
    importacao.mutate(arquivo, {
      onSuccess: (resultado) => {
        setImportado({ resultado, nomeArquivo, em: new Date() })
        setArquivo(null)
        if (resultado.importados > 0) {
          const ignoradas = resultado.falhas.length
          toast.success(
            `${plural(resultado.importados, 'lançamento importado', 'lançamentos importados')}.` +
              (ignoradas > 0 ? ` ${plural(ignoradas, 'linha ignorada', 'linhas ignoradas')}.` : ''),
          )
        }
      },
      onError: (erro) => {
        // Regra de lib/http: arquivo recusado (4xx) mostra a mensagem da API como veio, junto do arquivo; sem conexão,
        // sessão e 5xx ficam com as frases do front (sem conexão em toast, o resto junto do arquivo)
        const { status, mensagem } = traduzirErro(erro)
        if (status === 0) toast.error(mensagem)
        else setErroArquivo(mensagem)
      },
    })
  }

  const valor: ImportarContextValue = {
    arquivo,
    escolher: (novo) => {
      setErroArquivo(null)
      setArquivo(novo)
    },
    remover: () => {
      setErroArquivo(null)
      setArquivo(null)
    },
    erroArquivo,
    setErroArquivo,
    importar,
    importando: importacao.isPending,
    importado,
    importarOutro: () => {
      setImportado(null)
      setErroArquivo(null)
    },
    online,
    baixarModelo,
  }

  return <ImportarContext.Provider value={valor}>{children}</ImportarContext.Provider>
}

export function useImportarContext() {
  const contexto = useContext(ImportarContext)
  if (!contexto) throw new Error('useImportarContext precisa estar dentro de <ImportarProvider>')
  return contexto
}
