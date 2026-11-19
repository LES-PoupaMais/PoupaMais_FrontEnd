'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineBanner, OfflineMotivo } from '@/components/molecules/offline-banner'
import { AlterarSenhaForm } from '@/components/organisms/alterar-senha-form'
import { AparenciaTema } from '@/components/organisms/aparencia-tema'
import { DadosPessoaisForm } from '@/components/organisms/dados-pessoais-form'
import { ExcluirContaDialog } from '@/components/organisms/excluir-conta-dialog'
import { FotoPerfil } from '@/components/organisms/foto-perfil'
import { PrivacidadeConta, SeusLancamentos } from '@/components/organisms/perfil-atalhos'
import { PerfilTemplate } from '@/components/templates/perfil-template'
import { ROTAS } from '@/constants/rotas'
import { usePerfilContext } from './PerfilContext'
import { PerfilColunasSkeleton } from './PerfilSkeleton'

const ID_MOTIVO = 'perfil-sem-conexao'

function Cabecalho() {
  return (
    <>
      <h1 className="text-titulo-1">Perfil</h1>
      <p className="text-corpo text-muted-foreground">Seus dados, sua senha, a aparência e a privacidade da conta.</p>
    </>
  )
}

// Perfil (pranchetas perfil-*, excluir-conta-*): carregando (esqueleto dos cards), erro (ErrorState com "Tentar de novo"),
// sem conexão (OfflineBanner + botões que gravam desabilitados com o motivo) e o conteúdo.
export function PerfilView() {
  const p = usePerfilContext()
  const bloqueado = !p.online
  const aviso = bloqueado ? (
    <>
      <OfflineBanner variante="canto" />
      <OfflineMotivo id={ID_MOTIVO} />
    </>
  ) : undefined

  if (p.carregando) {
    return <PerfilColunasSkeleton cabecalho={<Cabecalho />} />
  }

  if (p.erroAoCarregar || !p.usuario) {
    return (
      <PerfilTemplate
        cabecalho={<Cabecalho />}
        aviso={aviso}
        estado={<ErrorState onTentarDeNovo={p.recarregar} tentando={p.recarregando} />}
      />
    )
  }

  const { usuario } = p
  return (
    <>
      <PerfilTemplate
        cabecalho={<Cabecalho />}
        aviso={aviso}
        principal={
          <>
            <FotoPerfil
              nome={usuario.nome}
              fotoUrl={p.fotoUrl}
              enviando={p.enviandoFoto}
              removendo={p.removendoFoto}
              erro={p.erroFoto}
              onEscolherArquivo={p.escolherFoto}
              onRemover={p.removerFoto}
              bloqueado={bloqueado}
              idMotivo={ID_MOTIVO}
            />
            <DadosPessoaisForm
              nome={usuario.nome}
              email={usuario.email}
              enviando={p.salvandoNome}
              erroNome={p.erroNome}
              onSubmit={p.salvarNome}
              bloqueado={bloqueado}
              idMotivo={ID_MOTIVO}
            />
            <AlterarSenhaForm
              enviando={p.trocandoSenha}
              onSubmit={p.trocarSenha}
              bloqueado={bloqueado}
              idMotivo={ID_MOTIVO}
            />
          </>
        }
        lateral={
          <>
            <AparenciaTema tema={p.tema} onTemaChange={p.escolherTema} />
            <SeusLancamentos
              hrefLixeira={ROTAS.lixeira}
              hrefCategorias={ROTAS.categorias}
              totalLixeira={p.totalLixeira}
              categorias={p.contagemCategorias}
            />
            <PrivacidadeConta
              hrefPrivacidade={ROTAS.privacidade}
              onBaixarDados={p.baixarDados}
              baixando={p.baixandoDados}
              onExcluirConta={p.abrirExcluir}
              bloqueado={bloqueado}
              idMotivo={ID_MOTIVO}
            />
          </>
        }
        rodape={
          <Button variant="contornado" className="w-full" loading={p.saindo} onClick={p.sair}>
            {!p.saindo && <LogOut aria-hidden="true" />}
            Sair da conta
          </Button>
        }
      />
      <ExcluirContaDialog
        aberto={p.excluirAberto}
        onCancelar={p.fecharExcluir}
        onConfirmar={p.excluirConta}
        excluindo={p.excluindo}
        erroSenha={p.erroSenhaExcluir}
        onBaixarDados={p.baixarDados}
        baixando={p.baixandoDados}
      />
    </>
  )
}
