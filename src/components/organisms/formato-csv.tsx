import { Download } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Como montar o CSV de importação (pranchetas importar-celular e importar-computador): regras, tabela de colunas, exemplo e,
// a partir de 768px, o botão "Baixar modelo CSV" no pé do card (no celular o link fica dentro da área de envio).
// Puro e estático: só o link do modelo chega por props.

export type FormatoCsvProps = {
  /** "Baixar modelo CSV" (`GET /lancamentos/template-csv`) */
  modeloHref: string
  className?: string
}

const COLUNAS: ReadonlyArray<[string, string]> = [
  ['descricao', 'Texto, até 100 caracteres'],
  ['tipo', 'RECEITA ou DESPESA'],
  ['data', 'dd/mm/aaaa, como 05/11/2026'],
  ['valor', 'Com vírgula nos centavos: 1.120,35'],
  ['categorias', 'Uma ou mais, separadas por |'],
]

const EXEMPLO = `descricao;tipo;data;valor;categorias
Mercado do mês;DESPESA;05/11/2026;1.120,35;Mercado
Jantar de aniversário;DESPESA;22/11/2026;268,90;Restaurantes|Lazer`

const CODIGO = 'bg-card text-foreground rounded-sm px-1 py-px font-mono text-xs'

export function FormatoCsv({ modeloHref, className }: FormatoCsvProps) {
  return (
    <section
      data-slot="formato-csv"
      aria-labelledby="formato-csv-titulo"
      className={cn(
        'rounded-card md:rounded-grande border-border bg-card text-card-foreground shadow-card flex flex-col gap-4 border p-5 md:p-6',
        className,
      )}
    >
      <h2
        id="formato-csv-titulo"
        className="text-rotulo-secao text-muted-foreground md:text-titulo-3 md:text-foreground uppercase md:normal-case"
      >
        <span className="md:hidden">Como montar o arquivo</span>
        <span className="hidden md:inline">Formato do arquivo</span>
      </h2>
      <ul className="text-corpo flex list-disc flex-col gap-1 pl-5">
        <li>Separe as colunas com ponto e vírgula (;).</li>
        <li>Salve em UTF-8, para os acentos não quebrarem.</li>
        <li>A primeira linha é o cabeçalho. Depois, um lançamento por linha.</li>
      </ul>
      <div className="border-border rounded-campo overflow-hidden border">
        <table className="text-legenda w-full border-collapse">
          <caption className="text-rotulo-secao text-muted-foreground bg-secondary px-4 py-3 text-left uppercase">
            Colunas, nesta ordem
          </caption>
          <thead>
            <tr className="border-border border-b">
              <th scope="col" className="text-muted-foreground px-4 py-2 text-left font-bold">
                Coluna
              </th>
              <th scope="col" className="text-muted-foreground px-4 py-2 text-left font-bold">
                O que vai nela
              </th>
            </tr>
          </thead>
          <tbody>
            {COLUNAS.map(([coluna, descricao]) => (
              <tr key={coluna} className="border-border border-b last:border-b-0">
                <td className="px-4 py-3 align-top">
                  <code className={CODIGO}>{coluna}</code>
                </td>
                <td className="px-4 py-3 align-top">{descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-rotulo-campo">Exemplo de linha</span>
        <pre className="rounded-campo bg-secondary text-foreground m-0 px-4 py-3 font-mono text-xs leading-[18px] [overflow-wrap:anywhere] whitespace-pre-wrap">
          {EXEMPLO}
        </pre>
      </div>
      <p className="text-legenda text-muted-foreground">
        Categorias que ainda não existem são criadas na hora. Linhas com erro, como uma data que não existe
        (31/02/2026), são ignoradas, e você vê o motivo de cada uma.
      </p>
      <Button asChild variant="contornado" className="mt-auto hidden self-start md:inline-flex">
        <a href={modeloHref} download>
          <Download aria-hidden="true" />
          Baixar modelo CSV
        </a>
      </Button>
    </section>
  )
}
