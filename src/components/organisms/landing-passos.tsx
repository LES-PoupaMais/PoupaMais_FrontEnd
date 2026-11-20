import { formatarMoeda } from '@/lib/format'

// "Como funciona" (landing-computador; não existe na prancheta do celular, por isso aparece a partir de 1024px):
// três passos e uma prévia das despesas por categoria com dados de exemplo (barras horizontais em despesa-grafico, com o
// valor ao fim de cada barra, como o CategoryBarChart do DS).
const PASSOS = [
  { titulo: 'Crie sua conta', texto: 'Só nome, e-mail e senha.' },
  { titulo: 'Registre ou importe', texto: 'Cada lançamento tem data, valor e uma ou mais categorias.' },
  { titulo: 'Acompanhe mês a mês', texto: 'Troque o mês no topo e compare com os meses anteriores.' },
]

const CATEGORIAS = [
  { nome: 'Aluguel', valor: 2200 },
  { nome: 'Mercado', valor: 1480.35 },
  { nome: 'Contas de casa', valor: 912.4 },
  { nome: 'Transporte', valor: 780 },
]

export function LandingPassos() {
  const maior = CATEGORIAS[0].valor
  return (
    <section aria-labelledby="passos-titulo" className="hidden px-5 py-12 lg:block">
      <div className="max-w-conteudo mx-auto grid grid-cols-2 items-center gap-12 px-3">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-rotulo-secao text-muted-foreground uppercase">Como funciona</p>
            <h2 id="passos-titulo" className="text-titulo-1 text-[32px] leading-10">
              Três passos e o mês está na tela
            </h2>
          </div>
          <ol className="flex flex-col gap-6">
            {PASSOS.map((passo, indice) => (
              <li key={passo.titulo} className="flex flex-col gap-3">
                <span
                  aria-hidden="true"
                  className="rounded-pilula bg-accent text-primary grid size-11 place-items-center text-[17px] font-extrabold tabular-nums"
                >
                  {indice + 1}
                </span>
                <h3 className="text-titulo-3">
                  <span className="sr-only">Passo {indice + 1}: </span>
                  {passo.titulo}
                </h3>
                <p className="text-corpo text-muted-foreground">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <article
          aria-label="Prévia: maiores despesas por categoria em novembro de 2026"
          className="bg-card border-border rounded-grande shadow-card flex flex-col gap-4 border p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-rotulo-secao text-muted-foreground uppercase">Despesas por categoria</h3>
            <span className="text-legenda text-muted-foreground">Nov/2026</span>
          </div>
          <ul className="flex flex-col gap-4">
            {CATEGORIAS.map(({ nome, valor }) => (
              <li key={nome} className="flex flex-col gap-1.5">
                <span className="text-corpo-forte">{nome}</span>
                {/* Como o CategoryBarChart do DS: sem trilho, a barra cresce até o valor, que fica logo depois dela */}
                <span className="flex items-center gap-2">
                  <span
                    className="bg-despesa-grafico block h-3.5 min-w-1 shrink-0 rounded-r-[4px]"
                    style={{ width: `calc((100% - 104px) * ${valor / maior})` }}
                  />
                  <span className="text-[13px] leading-[18px] font-bold whitespace-nowrap tabular-nums">
                    {formatarMoeda(valor)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
