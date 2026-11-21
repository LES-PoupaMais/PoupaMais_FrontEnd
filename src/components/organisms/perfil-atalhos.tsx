'use client'

import Link from 'next/link'
import { Download, List, ShieldCheck, Tag, Trash2, UserX } from 'lucide-react'
import { plural } from '@/lib/format'
import { LinhaDeAcao, ListaDeAcoes, PerfilSecao } from './perfil-secao'

// Seções "Seus lançamentos" (atalhos para a Lixeira e Categorias, com as contagens) e "Privacidade" (LGPD: baixar os dados,
// excluir a conta e o link da Política) do Perfil. As contagens chegam prontas (undefined = carregando: só o título aparece).

/** "3 lançamentos excluídos para restaurar" · "Nenhum lançamento na lixeira" */
export function textoDaLixeira(total: number): string {
  if (total === 0) return 'Nenhum lançamento na lixeira'
  return `${plural(total, 'lançamento excluído', 'lançamentos excluídos')} para restaurar`
}

/** "10 ativas e 2 inativas" · "10 ativas" · "Nenhuma categoria" */
export function textoDasCategorias(ativas: number, inativas: number): string {
  if (ativas === 0 && inativas === 0) return 'Nenhuma categoria'
  const partes = [
    ativas > 0 && plural(ativas, 'ativa', 'ativas'),
    inativas > 0 && plural(inativas, 'inativa', 'inativas'),
  ]
  return partes.filter(Boolean).join(' e ')
}

export type SeusLancamentosProps = {
  hrefLixeira: string
  hrefCategorias: string
  totalLixeira?: number
  categorias?: { ativas: number; inativas: number }
}

export function SeusLancamentos({ hrefLixeira, hrefCategorias, totalLixeira, categorias }: SeusLancamentosProps) {
  return (
    <PerfilSecao titulo="Seus lançamentos" icone={List}>
      <ListaDeAcoes>
        <LinhaDeAcao
          titulo="Lixeira de Lançamentos"
          icone={Trash2}
          href={hrefLixeira}
          legenda={totalLixeira === undefined ? undefined : textoDaLixeira(totalLixeira)}
        />
        <LinhaDeAcao
          titulo="Categorias"
          icone={Tag}
          href={hrefCategorias}
          legenda={categorias && textoDasCategorias(categorias.ativas, categorias.inativas)}
        />
      </ListaDeAcoes>
    </PerfilSecao>
  )
}

export type PrivacidadeContaProps = {
  hrefPrivacidade: string
  onBaixarDados: () => void
  baixando?: boolean
  onExcluirConta: () => void
  /** Sem conexão: excluir fica desabilitado (baixar também, porque precisa da API) */
  bloqueado?: boolean
  idMotivo?: string
}

export function PrivacidadeConta({
  hrefPrivacidade,
  onBaixarDados,
  baixando = false,
  onExcluirConta,
  bloqueado = false,
  idMotivo,
}: PrivacidadeContaProps) {
  const motivo = bloqueado ? idMotivo : undefined
  return (
    <PerfilSecao titulo="Privacidade" icone={ShieldCheck}>
      <ListaDeAcoes>
        <LinhaDeAcao
          titulo={baixando ? 'Baixando seus dados…' : 'Baixar meus dados'}
          legenda="Um arquivo com o perfil, as categorias e todos os lançamentos."
          icone={Download}
          onClick={onBaixarDados}
          disabled={bloqueado || baixando}
          aria-describedby={motivo}
        />
        <LinhaDeAcao
          titulo="Excluir minha conta"
          legenda="Apaga a conta e todos os dados. Não dá para desfazer."
          icone={UserX}
          perigo
          onClick={onExcluirConta}
          disabled={bloqueado}
          aria-describedby={motivo}
        />
      </ListaDeAcoes>
      <Link
        href={hrefPrivacidade}
        className="text-legenda text-primary hover:text-primaria-hover inline-flex min-h-11 items-center self-start font-bold underline"
      >
        Ler a Política de privacidade
      </Link>
    </PerfilSecao>
  )
}
