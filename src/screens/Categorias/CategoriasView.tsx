'use client'

import { FileUp, Plus, Tag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineBanner, OfflineMotivo } from '@/components/molecules/offline-banner'
import { CategoriaDialog } from '@/components/organisms/categoria-dialog'
import { CategoriaLista } from '@/components/organisms/categoria-lista'
import { ROTAS } from '@/constants/rotas'
import { useCategoriasContext } from './CategoriasContext'
import { CategoriasSkeleton } from './CategoriasSkeleton'

const MOTIVO_ID = 'categorias-motivo-offline'

// Categorias: cabeçalho (título a partir de 768px; no celular ele está na TopBar), "Nova categoria" e a lista,
// com os estados carregando, vazio, erro e sem conexão. O diálogo cria, renomeia, inativa e exclui.
export function CategoriasView() {
  const ctx = useCategoriasContext()
  const bloqueio = ctx.online ? {} : { 'aria-disabled': true as const, 'aria-describedby': MOTIVO_ID }

  const novaCategoria = (bloco: boolean) => (
    <Button
      className={bloco ? 'w-full md:w-auto' : undefined}
      onClick={() => ctx.online && ctx.abrirNova()}
      {...bloqueio}
    >
      <Plus aria-hidden="true" />
      Nova categoria
    </Button>
  )

  let conteudo
  if (ctx.carregando) conteudo = <CategoriasSkeleton somenteLista />
  else if (ctx.erro || !ctx.categorias)
    conteudo = <ErrorState onTentarDeNovo={ctx.tentarDeNovo} tentando={ctx.tentando} />
  else if (ctx.categorias.length === 0)
    conteudo = (
      <EmptyState
        icone={Tag}
        funcao="primaria"
        superficie="grande"
        titulo="Você ainda não tem categorias"
        texto="Crie categorias como Mercado ou Transporte para organizar seus lançamentos. Você também pode criar direto no formulário de lançamento."
        acoesEmColuna
        acoes={
          <>
            <Button onClick={() => ctx.online && ctx.abrirNova()} {...bloqueio}>
              <Plus aria-hidden="true" />
              Nova categoria
            </Button>
            <Button asChild variant="texto">
              <Link href={ROTAS.importar}>
                <FileUp aria-hidden="true" />
                Importar CSV com categorias
              </Link>
            </Button>
          </>
        }
      />
    )
  else
    conteudo = (
      <CategoriaLista
        categorias={ctx.categorias}
        periodo={ctx.periodo}
        onEditar={ctx.abrirEditar}
        onReativar={ctx.reativar}
        reativandoId={ctx.reativandoId}
        motivoBloqueioId={ctx.online ? undefined : MOTIVO_ID}
      />
    )

  const temLista = Boolean(ctx.categorias && ctx.categorias.length > 0)
  const categoriaAberta = ctx.dialogo?.modo === 'editar' ? ctx.dialogo.categoria : null

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {!ctx.online && <OfflineBanner variante="canto" />}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-titulo-1 hidden md:block">Categorias</h1>
          <p className="text-corpo text-muted-foreground">
            <span className="md:hidden">Organize seus lançamentos. Toque no lápis para renomear ou inativar.</span>
            <span className="hidden md:inline">Organize seus lançamentos. Crie, renomeie, inative ou reative.</span>
          </p>
        </div>
        {temLista && novaCategoria(true)}
      </header>
      {!ctx.online && <OfflineMotivo id={MOTIVO_ID} />}
      {conteudo}
      <CategoriaDialog
        aberto={ctx.dialogo !== null}
        onAbertoChange={(aberto) => !aberto && ctx.fecharDialogo()}
        categoria={categoriaAberta}
        onSalvar={ctx.salvar}
        salvando={ctx.salvando}
        erroNome={ctx.erroNome}
        onInativar={categoriaAberta?.ativa ? ctx.inativar : undefined}
        inativando={ctx.inativando}
        onExcluir={categoriaAberta ? ctx.excluir : undefined}
        excluindo={ctx.excluindo}
        emUso={ctx.emUso}
        semConexao={!ctx.online}
      />
    </div>
  )
}
