'use client'

import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useCategorias, useSalvarCategoria } from '@/hooks/use-categorias'
import { useAlterarStatusCategoria, useExcluirCategoria } from '@/hooks/use-mutacoes-categoria'
import { useOnline } from '@/hooks/use-online'
import { categoriaEmUso, erroDoNomeDaCategoria } from '@/lib/erro-categoria'
import { formatarPeriodo } from '@/lib/format'
import { traduzirErro } from '@/lib/http'
import { lerPeriodo } from '@/lib/periodo'
import type { Categoria, CategoriaComContagem } from '@/types/api'

// Tela Categorias (RF011/UC009/RN002): lista com a contagem do mês, criar, renomear, inativar, reativar e excluir.
// A contagem usa o mês da URL (?mes&ano) ou o atual. 409 e 400 vão para o campo do diálogo. Excluir pede confirmação
// (ConfirmDialog) antes do DELETE; 422 no DELETE = "em uso": a mensagem da API vai no aviso do diálogo.

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
  /** "Excluir categoria" do diálogo: abre a confirmação */
  excluir: () => void
  confirmandoExclusao: boolean
  cancelarExclusao: () => void
  /** Confirmou: manda o DELETE */
  confirmarExclusao: () => void
  excluindo: boolean
  /** Mensagem da API quando o DELETE respondeu 422 (em uso) */
  avisoEmUso: string | null
  reativar: (categoria: Categoria) => void
  reativandoId: number | null
}

const CategoriasContext = createContext<CategoriasContextValue | null>(null)

/** Regra de lib/http: a mensagem da API como veio; sem conexão, sessão e 5xx com as frases do front */
const mensagemDe = (erro: unknown) => traduzirErro(erro).mensagem

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
  const [avisoEmUso, setAvisoEmUso] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const abrir = (novo: Dialogo) => {
    setErroNome(null)
    setAvisoEmUso(null)
    setConfirmandoExclusao(false)
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
    if (categoriaAberta) setConfirmandoExclusao(true)
  }

  const confirmarExclusao = () => {
    if (!categoriaAberta) return
    excluirCategoria.mutate(categoriaAberta.id, {
      onSuccess: () => {
        setConfirmandoExclusao(false)
        setDialogo(null)
        toast.success('Categoria excluída')
      },
      onError: (erro) => {
        setConfirmandoExclusao(false)
        if (categoriaEmUso(erro)) setAvisoEmUso(mensagemDe(erro))
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
    confirmandoExclusao,
    cancelarExclusao: () => setConfirmandoExclusao(false),
    confirmarExclusao,
    excluindo: excluirCategoria.isPending,
    avisoEmUso,
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
