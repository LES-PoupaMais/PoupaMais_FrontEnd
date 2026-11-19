import Link from 'next/link'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { MoneyText } from '@/components/atoms/money-text'
import { formatarDataExtenso, formatarInstante } from '@/lib/data'
import type { Lancamento } from '@/types/api'

// Editar um lançamento que está na lixeira (prancheta editar-lixeira-computador): em vez do formulário, o aviso de que não dá
// para editar, os dados só para leitura e a ação Restaurar (volta INATIVO, RN006). Puro: a tela restaura e mostra o toast.
export type LancamentoNaLixeiraProps = {
  lancamento: Lancamento
  restaurando?: boolean
  onRestaurar: () => void
  /** Destino de "Ver a lixeira" */
  hrefLixeira: string
}

const ROTULO_TIPO = { RECEITA: 'Receita', DESPESA: 'Despesa' } as const

export function LancamentoNaLixeira({
  lancamento,
  restaurando = false,
  onRestaurar,
  hrefLixeira,
}: LancamentoNaLixeiraProps) {
  const { descricao, tipo, valor, data, categorias, dataCadastro, dataExclusao } = lancamento
  const funcao = tipo === 'RECEITA' ? 'receita' : 'despesa'

  return (
    <section aria-labelledby="lixeira-titulo" className="flex flex-col gap-5">
      <p role="status" className="bg-atencao-fundo text-atencao text-corpo rounded-campo px-4 py-3 font-semibold">
        Este lançamento está na lixeira e não pode ser editado. Ele não aparece na lista nem conta no saldo. Restaure
        para poder editar.
      </p>
      <div className="flex items-center gap-3">
        <FunctionIcon funcao={funcao} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="lixeira-titulo" className="text-titulo-3 truncate">
            {descricao}
          </h2>
          <span className="flex flex-wrap gap-1">
            <Badge variant={funcao}>{ROTULO_TIPO[tipo]}</Badge>
            <Badge variant="contorno">Na lixeira</Badge>
          </span>
        </div>
      </div>
      <p>
        <MoneyText valor={valor} tipo={tipo} tamanho="destaque" suave anunciarTipo />
      </p>
      <dl className="divide-border border-border flex flex-col divide-y border-y">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-legenda text-muted-foreground">Data</dt>
          <dd className="text-corpo-forte">
            <time dateTime={data}>{formatarDataExtenso(data)}</time>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-legenda text-muted-foreground">Categorias</dt>
          <dd className="flex flex-wrap justify-end gap-1">
            {categorias.map((categoria) => (
              <span key={categoria.id} className="bg-secondary text-legenda rounded-pilula px-2.5 py-0.5 font-semibold">
                {categoria.descricao}
              </span>
            ))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-legenda text-muted-foreground">Conta no saldo</dt>
          <dd className="text-corpo-forte">Não · volta desligado ao restaurar</dd>
        </div>
      </dl>
      <p className="text-legenda text-muted-foreground flex flex-col gap-0.5">
        <span>Criado em {formatarInstante(dataCadastro)}</span>
        {dataExclusao && <span>Movido para a lixeira em {formatarInstante(dataExclusao)}</span>}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button loading={restaurando} onClick={onRestaurar}>
          Restaurar
        </Button>
        <Button variant="texto" asChild>
          <Link href={hrefLixeira}>Ver a lixeira</Link>
        </Button>
      </div>
    </section>
  )
}
