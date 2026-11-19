'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import { logoutAction } from '@/actions/auth.actions'
import { excluirContaAction, trocarSenhaAction, type ResultadoPerfil } from '@/actions/perfil.actions'
import type { ControleAlterarSenha } from '@/components/organisms/alterar-senha-form'
import type { TemaPreferido } from '@/components/organisms/aparencia-tema'
import { ROTAS } from '@/constants/rotas'
import { useCategorias } from '@/hooks/use-categorias'
import { useLancamentos } from '@/hooks/use-lancamentos'
import { useOnline } from '@/hooks/use-online'
import { useAtualizarNome, useBaixarMeusDados, useRemoverFoto, useTrocarFoto } from '@/hooks/use-perfil'
import { fotoDoUsuario, useUsuario } from '@/hooks/use-usuario'
import { salvarArquivo } from '@/lib/baixar-arquivo'
import { ErroApi, MENSAGEM_SEM_CONEXAO } from '@/lib/http'
import {
  MENSAGEM_SENHA_ATUAL_INCORRETA,
  MENSAGEM_SENHA_IGUAL,
  validarFoto,
  type TrocarSenhaInput,
} from '@/schemas/perfil.schema'
import type { Usuario } from '@/types/api'
import { useMontado } from './usePerfilAmbiente'

// Estado e ações do Perfil (RN015/RN016): nome, foto, senha (Server Action que troca o cookie), tema (next-themes),
// "Baixar meus dados" (LGPD), excluir conta (Server Action que apaga o cookie → "/" com toast) e "Sair" (celular).
// Toda ação termina em toast; erros de campo voltam para os organismos (nunca a mensagem crua da API).

const NOME_ARQUIVO_DADOS = 'meus-dados-poupamais.json'
const LOGIN_VOLTANDO_AO_PERFIL = `${ROTAS.login}?voltar=${encodeURIComponent(ROTAS.perfil)}`

type PerfilContextValue = {
  usuario: Usuario | undefined
  carregando: boolean
  erroAoCarregar: boolean
  recarregar: () => void
  recarregando: boolean
  online: boolean
  fotoUrl: string | null

  salvarNome: (dados: { nome: string }) => void
  salvandoNome: boolean
  erroNome: string | null

  escolherFoto: (arquivo: File) => void
  enviandoFoto: boolean
  removerFoto: () => void
  removendoFoto: boolean
  erroFoto: string | null

  trocarSenha: (dados: TrocarSenhaInput, controle: ControleAlterarSenha) => void
  trocandoSenha: boolean

  /** null até hidratar (o tema guardado só existe no navegador) */
  tema: TemaPreferido | null
  escolherTema: (tema: TemaPreferido) => void

  totalLixeira: number | undefined
  contagemCategorias: { ativas: number; inativas: number } | undefined

  baixarDados: () => void
  baixandoDados: boolean

  excluirAberto: boolean
  abrirExcluir: () => void
  fecharExcluir: () => void
  excluirConta: (dados: { senha: string }) => void
  excluindo: boolean
  erroSenhaExcluir: string | null

  sair: () => void
  saindo: boolean
}

const PerfilContext = createContext<PerfilContextValue | null>(null)

/** Foto recusada pela API (422): traduz para as mensagens do DS (nunca o texto cru). */
function mensagemDaFoto(erro: unknown): string {
  if (erro instanceof ErroApi && erro.status === 422) {
    return /2\s*MB/i.test(erro.message)
      ? 'A foto deve ter no máximo 2 MB. Escolha uma imagem menor.'
      : 'A foto deve ser uma imagem JPG, PNG ou WEBP.'
  }
  if (erro instanceof ErroApi && erro.status === 0) return MENSAGEM_SEM_CONEXAO
  return 'Não foi possível enviar a foto. Tente de novo.'
}

function semConexao(erro: unknown) {
  return erro instanceof ErroApi && erro.status === 0
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const online = useOnline()
  const montado = useMontado()
  const { theme, setTheme } = useTheme()

  const usuarioQuery = useUsuario()
  const lixeira = useLancamentos({ status: 'DELETADO' }, { tamanho: 1 })
  const categorias = useCategorias()

  const atualizarNome = useAtualizarNome()
  const trocarFoto = useTrocarFoto()
  const removerFotoMutation = useRemoverFoto()
  const baixarMeusDados = useBaixarMeusDados()

  const [erroNome, setErroNome] = useState<string | null>(null)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [excluirAberto, setExcluirAberto] = useState(false)
  const [erroSenhaExcluir, setErroSenhaExcluir] = useState<string | null>(null)
  const [trocandoSenha, iniciarTrocaSenha] = useTransition()
  const [excluindo, iniciarExclusao] = useTransition()
  const [saindo, iniciarSaida] = useTransition()

  /** Falhas comuns das Server Actions (sessão vencida, sem internet, erro do servidor) */
  function tratarFalhaComum(resultado: Exclude<ResultadoPerfil, { ok: true }>, mensagemErro: string) {
    if (resultado.motivo === 'sessao') router.replace(LOGIN_VOLTANDO_AO_PERFIL)
    else if (resultado.motivo === 'conexao') toast.error(MENSAGEM_SEM_CONEXAO)
    else toast.error(mensagemErro)
  }

  const salvarNome = (dados: { nome: string }) => {
    setErroNome(null)
    atualizarNome.mutate(dados, {
      onSuccess: () => toast.success('Nome salvo'),
      onError: (erro) => {
        const doCampo = erro instanceof ErroApi ? erro.erros.find((e) => e.campo === 'nome') : undefined
        if (doCampo) setErroNome('Confira o nome: use até 150 caracteres.')
        toast.error(semConexao(erro) ? MENSAGEM_SEM_CONEXAO : 'Não foi possível salvar o nome.')
      },
    })
  }

  const escolherFoto = (arquivo: File) => {
    const invalida = validarFoto(arquivo) // RN015: confere antes de enviar
    setErroFoto(invalida)
    if (invalida) return
    trocarFoto.mutate(arquivo, {
      onSuccess: () => toast.success('Foto atualizada'),
      onError: (erro) => setErroFoto(mensagemDaFoto(erro)),
    })
  }

  const removerFoto = () => {
    setErroFoto(null)
    removerFotoMutation.mutate(undefined, {
      onSuccess: () => toast.success('Foto removida'),
      onError: (erro) => toast.error(semConexao(erro) ? MENSAGEM_SEM_CONEXAO : 'Não foi possível remover a foto.'),
    })
  }

  const trocarSenha = (dados: TrocarSenhaInput, controle: ControleAlterarSenha) =>
    iniciarTrocaSenha(async () => {
      const resultado = await trocarSenhaAction({ senhaAtual: dados.senhaAtual, novaSenha: dados.novaSenha })
      if (resultado.ok) {
        controle.limpar()
        toast.success('Senha alterada')
      } else if (resultado.motivo === 'senha-incorreta') {
        controle.definirErro('senhaAtual', MENSAGEM_SENHA_ATUAL_INCORRETA)
      } else if (resultado.motivo === 'senha-igual') {
        controle.definirErro('novaSenha', MENSAGEM_SENHA_IGUAL)
      } else {
        tratarFalhaComum(resultado, 'Não foi possível alterar a senha.')
      }
    })

  const baixarDados = () =>
    baixarMeusDados.mutate(undefined, {
      onSuccess: ({ blob, nomeArquivo }) => {
        salvarArquivo(blob, nomeArquivo ?? NOME_ARQUIVO_DADOS)
        toast.success('Seus dados foram baixados')
      },
      onError: (erro) => toast.error(semConexao(erro) ? MENSAGEM_SEM_CONEXAO : 'Não foi possível baixar seus dados.'),
    })

  const excluirConta = ({ senha }: { senha: string }) =>
    iniciarExclusao(async () => {
      setErroSenhaExcluir(null)
      const resultado = await excluirContaAction({ senha })
      if (resultado.ok) {
        // A conta não existe mais: nada da sessão pode ficar no cache
        queryClient.clear()
        toast.success('Sua conta foi excluída.')
        router.replace(ROTAS.inicio)
      } else if (resultado.motivo === 'senha-incorreta') {
        setErroSenhaExcluir('Senha incorreta.')
      } else {
        tratarFalhaComum(resultado, 'Não foi possível excluir a conta.')
      }
    })

  const usuario = usuarioQuery.data
  const itensCategorias = categorias.data
  const valor: PerfilContextValue = {
    usuario,
    carregando: usuarioQuery.isPending,
    erroAoCarregar: usuarioQuery.isError && !usuario,
    recarregar: () => void usuarioQuery.refetch(),
    recarregando: usuarioQuery.isFetching,
    online,
    fotoUrl: fotoDoUsuario(usuario, usuarioQuery.dataUpdatedAt),

    salvarNome,
    salvandoNome: atualizarNome.isPending,
    erroNome,

    escolherFoto,
    enviandoFoto: trocarFoto.isPending,
    removerFoto,
    removendoFoto: removerFotoMutation.isPending,
    erroFoto,

    trocarSenha,
    trocandoSenha,

    tema: montado ? ((theme as TemaPreferido | undefined) ?? 'system') : null,
    escolherTema: setTheme,

    totalLixeira: lixeira.data?.total,
    contagemCategorias: itensCategorias && {
      ativas: itensCategorias.filter((c) => c.ativa).length,
      inativas: itensCategorias.filter((c) => !c.ativa).length,
    },

    baixarDados,
    baixandoDados: baixarMeusDados.isPending,

    excluirAberto,
    abrirExcluir: () => {
      setErroSenhaExcluir(null)
      setExcluirAberto(true)
    },
    fecharExcluir: () => setExcluirAberto(false),
    excluirConta,
    excluindo,
    erroSenhaExcluir,

    sair: () => iniciarSaida(() => logoutAction()),
    saindo,
  }

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>
}

export function usePerfilContext() {
  const contexto = useContext(PerfilContext)
  if (!contexto) throw new Error('usePerfilContext precisa estar dentro de <PerfilProvider>')
  return contexto
}
