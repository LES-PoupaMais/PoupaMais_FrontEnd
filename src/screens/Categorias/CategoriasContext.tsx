'use client'

import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useCategorias, useSalvarCategoria } from '@/hooks/use-categorias'
import { useAlterarStatusCategoria, useExcluirCategoria } from '@/hooks/use-mutacoes-categoria'
import { useOnline } from '@/hooks/use-online'
import { categoriaEmUso, erroDoNomeDaCategoria } from '@/lib/erro-categoria'
import { formatarPeriodo } from '@/lib/format'
import { ErroApi, MENSAGEM_ERRO_PADRAO } from '@/lib/http'
import { lerPeriodo } from '@/lib/periodo'
import type { Categoria, CategoriaComContagem } from '@/types/api'

// Tela Categorias (RF011/UC009/RN002): lista com a contagem do mês, criar, renomear, inativar, reativar e excluir.
// A contagem usa o mês da URL (?mes&ano) ou o atual. 409 e 400 vão para o campo do diálogo; 422 no DELETE = "em uso".

type Dialogo = { modo: 'nova' } | { modo: 'editar'; categoria: Categoria } | null

type CategoriasContextValue = {
  categorias: CategoriaComContagem[] | undefined
  carregando: boolean
  erro: boolean
  tentarDeNovo: () => void
  tentando: boolean
  /** "Nov/2026" */
  periodo: string
  online: boolean
  dialogo: Dialogo
  abrirNova: () => void
  abrirEditar: (categoria: Categoria) => void
  fecharDialogo: () => void
  salvar: (descricao: string) => void
  salvando: boolean
  erroNome: string | null
  inativar: () => void
  inativando: boolean
  excluir: () => void
  excluindo: boolean
  emUso: boolean
  reativar: (categoria: Categoria) => void
  reativandoId: number | null
}

const CategoriasContext = createContext<CategoriasContextValue | null>(null)

const mensagemDe = (erro: unknown) => (erro instanceof ErroApi ? erro.message : MENSAGEM_ERRO_PADRAO)

export function CategoriasProvider({ children }: { children: ReactNode }) {
  const parametros = useSearchParams()
  const { mes, ano } = lerPeriodo(parametros)
  const consulta = useCategorias({ mes, ano })
  const salvarCategoria = useSalvarCategoria()
  const alterarStatus = useAlterarStatusCategoria()
  const excluirCategoria = useExcluirCategoria()
  const online = useOnline()

  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [erroNome, setErroNome] = useState<string | null>(null)
  const [emUso, setEmUso] = useState(false)

  const abrir = (novo: Dialogo) => {
    setErroNome(null)
    setEmUso(false)
    setDialogo(novo)
  }

  const categoriaAberta = dialogo?.modo === 'editar' ? dialogo.categoria : null

  const salvar = (descricao: string) => {
    if (!dialogo) return
    setErroNome(null)
    salvarCategoria.mutate(
      { id: categoriaAberta?.id, descricao },
      {
        onSuccess: () => {
          setDialogo(null)
          toast.success(categoriaAberta ? 'Categoria renomeada' : 'Categoria criada')
        },
        onError: (erro) => {
          const doCampo = erroDoNomeDaCategoria(erro)
          if (doCampo) setErroNome(doCampo)
          else toast.error(mensagemDe(erro))
        },
      },
    )
  }

  const inativar = () => {
    if (!categoriaAberta) return
    alterarStatus.mutate(
      { id: categoriaAberta.id, ativa: false },
      {
        onSuccess: () => {
          setDialogo(null)
          toast.success('Categoria inativada')
        },
        onError: (erro) => toast.error(mensagemDe(erro)),
      },
    )
  }

  const excluir = () => {
    if (!categoriaAberta) return
    excluirCategoria.mutate(categoriaAberta.id, {
      onSuccess: () => {
        setDialogo(null)
        toast.success('Categoria excluída')
      },
      onError: (erro) => {
        if (categoriaEmUso(erro)) setEmUso(true)
        else toast.error(mensagemDe(erro))
      },
    })
  }

  const reativar = (categoria: Categoria) =>
    alterarStatus.mutate(
      { id: categoria.id, ativa: true },
      {
        onSuccess: () => toast.success('Categoria reativada'),
        onError: (erro) => toast.error(mensagemDe(erro)),
      },
    )

  const valor: CategoriasContextValue = {
    categorias: consulta.data,
    carregando: consulta.isPending,
    erro: consulta.isError && !consulta.data,
    tentarDeNovo: () => void consulta.refetch(),
    tentando: consulta.isFetching,
    periodo: formatarPeriodo(mes, ano),
    online,
    dialogo,
    abrirNova: () => abrir({ modo: 'nova' }),
    abrirEditar: (categoria) => abrir({ modo: 'editar', categoria }),
    fecharDialogo: () => setDialogo(null),
    salvar,
    salvando: salvarCategoria.isPending,
    erroNome,
    inativar,
    inativando: alterarStatus.isPending && Boolean(categoriaAberta),
    excluir,
    excluindo: excluirCategoria.isPending,
    emUso,
    reativar,
    reativandoId: alterarStatus.isPending && !categoriaAberta ? (alterarStatus.variables?.id ?? null) : null,
  }

  return <CategoriasContext.Provider value={valor}>{children}</CategoriasContext.Provider>
}

export function useCategoriasContext() {
  const contexto = useContext(CategoriasContext)
  if (!contexto) throw new Error('useCategoriasContext precisa estar dentro de <CategoriasProvider>')
  return contexto
}
