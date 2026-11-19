'use client'

import { Check, ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { ConfirmDialog } from '@/components/molecules/confirm-dialog'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineBanner, OfflineMotivo } from '@/components/molecules/offline-banner'
import { CategoriaDialog } from '@/components/organisms/categoria-dialog'
import { LancamentoForm } from '@/components/organisms/lancamento-form'
import { TransactionDetail } from '@/components/organisms/transaction-detail'
import { FormPageTemplate } from '@/components/templates/form-page-template'
import { ROTAS } from '@/constants/rotas'
import { formatarDataExtenso } from '@/lib/data'
import { useLancamentoFormContext } from './LancamentoFormContext'
import { LancamentoFormSkeleton } from './LancamentoFormSkeleton'

const ID_FORM = 'lancamento-form'
const ID_MOTIVO_OFFLINE = 'lancamento-form-sem-conexao'

function Voltar({ href, destino }: { href: string; destino: string }) {
  return (
    <Button variant="texto" asChild className="-ml-3">
      <Link href={href}>
        <ChevronLeft aria-hidden="true" />
        {destino}
      </Link>
    </Button>
  )
}

export function LancamentoFormView() {
  const ctx = useLancamentoFormContext()
  const { modo, estado, lancamento, enviando, semConexao, sujo, hrefLista } = ctx
  const titulo = modo === 'novo' ? 'Novo lançamento' : 'Editar lançamento'

  if (estado === 'carregando') return <LancamentoFormSkeleton titulo={titulo} />

  if (estado === 'nao-encontrado' || estado === 'erro') {
    return (
      <FormPageTemplate titulo={titulo} voltar={<Voltar href={ROTAS.lancamentos} destino="Lançamentos" />}>
        {estado === 'erro' ? (
          <ErrorState
            semCartao
            onTentarDeNovo={ctx.recarregar}
            tentando={ctx.recarregando}
            texto="Não conseguimos abrir este lançamento. Confira sua conexão e tente de novo."
          />
        ) : (
          <ErrorState
            semCartao
            tipo="nao-encontrado"
            titulo="Lançamento não encontrado"
            texto="Ele pode ter sido excluído, ou o endereço está errado."
            href={ROTAS.lancamentos}
            rotuloAcao="Voltar para Lançamentos"
          />
        )}
      </FormPageTemplate>
    )
  }

  const descricao =
    modo === 'novo'
      ? 'Registre uma receita ou uma despesa do mês.'
      : lancamento && `${lancamento.descricao} · ${formatarDataExtenso(lancamento.data)}`

  if (estado === 'lixeira' && lancamento) {
    return (
      <FormPageTemplate
        titulo={titulo}
        descricao={descricao || undefined}
        voltar={<Voltar href={ROTAS.lixeira} destino="Lixeira" />}
      >
        <TransactionDetail
          lancamento={lancamento}
          restaurando={ctx.restaurando}
          onRestaurar={ctx.restaurar}
          acaoExtra={
            <Button variant="texto" asChild>
              <Link href={ROTAS.lixeira}>Ver a lixeira</Link>
            </Button>
          }
        />
      </FormPageTemplate>
    )
  }

  const botaoSalvar = (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Button
        type="submit"
        form={ID_FORM}
        loading={enviando}
        aria-disabled={semConexao || enviando || undefined}
        aria-describedby={semConexao ? ID_MOTIVO_OFFLINE : undefined}
        onClick={(evento) => {
          if (semConexao) evento.preventDefault()
        }}
        className="w-full md:w-auto"
      >
        {!enviando && <Check aria-hidden="true" />}
        {enviando ? 'Salvando lançamento…' : 'Salvar lançamento'}
      </Button>
      {enviando && (
        <p role="status" className="text-legenda text-muted-foreground text-center md:sr-only">
          Aguarde: os campos voltam quando terminar.
        </p>
      )}
      {semConexao && <OfflineMotivo id={ID_MOTIVO_OFFLINE} className="md:hidden" />}
    </div>
  )

  const acoes = (
    <>
      {modo === 'novo' ? (
        <Button
          variant="texto"
          className="hidden md:mr-auto md:inline-flex"
          disabled={!sujo || enviando}
          onClick={ctx.limpar}
        >
          Limpar
        </Button>
      ) : (
        <Button
          variant="perigo-texto"
          className="hidden md:mr-auto md:inline-flex"
          disabled={enviando}
          onClick={ctx.moverParaLixeira}
        >
          <Trash2 aria-hidden="true" />
          Mover para a lixeira
        </Button>
      )}
      <Button variant="contornado" asChild className="hidden md:inline-flex">
        <Link href={hrefLista}>Cancelar</Link>
      </Button>
      {botaoSalvar}
    </>
  )

  return (
    <>
      {/* Celular: "Limpar" à direita da TopBar (a TopBar da casca não tem slot de ação) */}
      {modo === 'novo' && (
        <Button
          variant="texto"
          className="fixed top-2 right-2 z-30 md:hidden"
          disabled={!sujo || enviando}
          onClick={ctx.limpar}
        >
          Limpar
        </Button>
      )}
      <FormPageTemplate
        titulo={titulo}
        descricao={descricao || undefined}
        voltar={<Voltar href={hrefLista} destino="Lançamentos" />}
        aviso={semConexao && <OfflineBanner variante="canto" />}
        acoes={acoes}
      >
        {ctx.valoresIniciais && (
          <LancamentoForm
            key={`${ctx.versaoDoFormulario}-${lancamento?.id ?? 'novo'}`}
            id={ID_FORM}
            valoresIniciais={ctx.valoresIniciais}
            hoje={ctx.hoje ?? undefined}
            categorias={ctx.categorias}
            carregandoCategorias={ctx.carregandoCategorias}
            avisoCategorias={
              ctx.erroCategorias && (
                <ActionBanner
                  variante="erro"
                  texto="Não foi possível carregar as categorias."
                  acoes={[{ rotulo: 'Tentar de novo', onClick: ctx.recarregarCategorias }]}
                />
              )
            }
            enviando={enviando}
            apresentacaoData={ctx.apresentacaoData}
            errosDoServidor={ctx.errosDoServidor}
            onSubmit={ctx.salvar}
            onCriarCategoria={ctx.abrirNovaCategoria}
            onSujoChange={ctx.setSujo}
            rodape={
              modo === 'editar' && (
                <Button
                  variant="perigo-texto"
                  className="self-start md:hidden"
                  disabled={enviando}
                  onClick={ctx.moverParaLixeira}
                >
                  <Trash2 aria-hidden="true" />
                  Mover para a lixeira
                </Button>
              )
            }
          />
        )}
      </FormPageTemplate>

      <CategoriaDialog
        aberto={ctx.novaCategoria.aberto}
        onAbertoChange={(abrir) => !abrir && ctx.fecharNovaCategoria()}
        nomeInicial={ctx.novaCategoria.nome}
        texto={
          ctx.novaCategoria.nome.trim()
            ? `Você digitou "${ctx.novaCategoria.nome.trim()}" na busca. Confira o nome antes de criar.`
            : undefined
        }
        rotuloNome="Nome da categoria"
        ajuda="Ela já entra escolhida neste lançamento."
        erroNome={ctx.novaCategoria.erro}
        salvando={ctx.criandoCategoria}
        onSalvar={ctx.criarCategoria}
        semConexao={ctx.semConexao}
      />

      <ConfirmDialog
        aberto={ctx.descarteAberto}
        titulo="Descartar alterações?"
        texto={
          modo === 'novo'
            ? 'Você preencheu este lançamento e ainda não salvou. Se sair agora, o que você preencheu se perde.'
            : 'Você mudou este lançamento e ainda não salvou. Se sair agora, as mudanças se perdem.'
        }
        rotuloConfirmar="Descartar"
        onCancelar={ctx.cancelarDescarte}
        onConfirmar={ctx.confirmarDescarte}
      />
    </>
  )
}
