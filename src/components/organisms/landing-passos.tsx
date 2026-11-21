import { CategoryBarChart } from './category-bar-chart'

// "Como funciona" (landing-computador; não existe na prancheta do celular, por isso aparece a partir de 1024px):
// três passos e uma prévia das despesas por categoria com dados de exemplo: o próprio CategoryBarChart em modo `previa`
// (sem links, total nem dica), como a prancheta.
const PASSOS = [
  { titulo: 'Crie sua conta', texto: 'Só nome, e-mail e senha.' },
  { titulo: 'Registre ou importe', texto: 'Cada lançamento tem data, valor e uma ou mais categorias.' },
  { titulo: 'Acompanhe mês a mês', texto: 'Troque o mês no topo e compare com os meses anteriores.' },
]

const CATEGORIAS = [
  { categoriaId: 1, descricao: 'Aluguel', valor: 2200 },
  { categoriaId: 2, descricao: 'Mercado', valor: 1480.35 },
  { categoriaId: 3, descricao: 'Contas de casa', valor: 912.4 },
  { categoriaId: 4, descricao: 'Transporte', valor: 780 },
]

export function LandingPassos() {
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
        <CategoryBarChart
          previa
          dados={CATEGORIAS}
          total={CATEGORIAS.reduce((soma, c) => soma + c.valor, 0)}
          mes={11}
          ano={2026}
          aria-label="Prévia: maiores despesas por categoria em novembro de 2026"
        />
      </div>
    </section>
  )
}
