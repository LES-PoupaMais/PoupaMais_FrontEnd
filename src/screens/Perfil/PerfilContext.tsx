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
import { traduzirErro } from '@/lib/http'
import { validarFoto, type TrocarSenhaInput } from '@/schemas/perfil.schema'
import type { Usuario } from '@/types/api'
import { useHidratado } from '@/hooks/use-hidratado'

// Estado e ações do Perfil (RN015/RN016): nome, foto, senha (Server Action que troca o cookie), tema (next-themes),
// "Baixar meus dados" (LGPD), excluir conta (Server Action que apaga o cookie → "/" com toast) e "Sair" (celular).
// Toda ação termina em toast. Erros: `traduzirErro` (lib/http) mostra a mensagem da API como veio e os `erros[]` nos
// campos; sem conexão, sessão e 5xx ficam com as frases do front. A tela não deduz a causa pelo texto.

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

export function PerfilProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const online = useOnline()
  const montado = useHidratado()
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

  /** Falha de Server Action: sessão vencida vai para o login; o resto vira toast (mensagem da API ou a da tela) */
  function tratarFalha(resultado: Exclude<ResultadoPerfil, { ok: true }>, padrao: string) {
    if (resultado.status === 401) router.replace(LOGIN_VOLTANDO_AO_PERFIL)
    else toast.error(traduzirErro(resultado, { padrao }).mensagem)
  }

  const salvarNome = (dados: { nome: string }) => {
    setErroNome(null)
    atualizarNome.mutate(dados, {
      onSuccess: () => toast.success('Nome salvo'),
      onError: (erro) => {
        const padrao = 'Não foi possível salvar o nome.'
        const { mensagem, campos } = traduzirErro(erro, { padrao })
        // Erro do campo: a mensagem da API vai no campo e o toast só resume
        if (campos.nome) setErroNome(campos.nome)
        toast.error(campos.nome ? padrao : mensagem)
      },
    })
  }

  const escolherFoto = (arquivo: File) => {
    const invalida = validarFoto(arquivo) // RN015: confere antes de enviar
    setErroFoto(invalida)
    if (invalida) return
    trocarFoto.mutate(arquivo, {
      onSuccess: () => toast.success('Foto atualizada'),
      onError: (erro) =>
        setErroFoto(traduzirErro(erro, { padrao: 'Não foi possível enviar a foto. Tente de novo.' }).mensagem),
    })
  }

  const removerFoto = () => {
    setErroFoto(null)
    removerFotoMutation.mutate(undefined, {
      onSuccess: () => toast.success('Foto removida'),
      onError: (erro) => toast.error(traduzirErro(erro, { padrao: 'Não foi possível remover a foto.' }).mensagem),
    })
  }

  const trocarSenha = (dados: TrocarSenhaInput, controle: ControleAlterarSenha) =>
    iniciarTrocaSenha(async () => {
      const resultado = await trocarSenhaAction({ senhaAtual: dados.senhaAtual, novaSenha: dados.novaSenha })
      if (resultado.ok) {
        controle.limpar()
        toast.success('Senha alterada')
      } else {
        // `erros[]` com campo vão para o campo; sem campo, a mensagem da API vai no toast
        const { campos } = traduzirErro(resultado)
        const doCampo = (['senhaAtual', 'novaSenha'] as const).filter((campo) => campos[campo])
        doCampo.forEach((campo) => controle.definirErro(campo, campos[campo]))
        if (doCampo.length === 0) tratarFalha(resultado, 'Não foi possível alterar a senha.')
      }
    })

  const baixarDados = () =>
    baixarMeusDados.mutate(undefined, {
      onSuccess: ({ blob, nomeArquivo }) => {
        salvarArquivo(blob, nomeArquivo ?? NOME_ARQUIVO_DADOS)
        toast.success('Seus dados foram baixados')
      },
      onError: (erro) => toast.error(traduzirErro(erro, { padrao: 'Não foi possível baixar seus dados.' }).mensagem),
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
      } else if (resultado.status === 401) {
        tratarFalha(resultado, 'Não foi possível excluir a conta.')
      } else {
        // O diálogo mostra o erro no campo de senha: o do `erros[]` (campo senha) ou a mensagem da API como veio
        const { mensagem, campos } = traduzirErro(resultado, { padrao: 'Não foi possível excluir a conta.' })
        const daApi = resultado.status >= 400 && resultado.status < 500 && (campos.senha || resultado.mensagem)
        if (daApi) setErroSenhaExcluir(campos.senha ?? mensagem)
        else toast.error(mensagem)
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
