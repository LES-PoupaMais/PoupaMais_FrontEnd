import { Download, FileUp, LayoutDashboard, SunMoon, Tags, type LucideIcon } from 'lucide-react'
import { FunctionIcon } from '@/components/atoms/function-icon'

// "O que o PoupaMais faz" (landing): lista num card no celular; grade de cards (3 + 2) no computador. Estático.
const ITENS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    Icone: LayoutDashboard,
    titulo: 'Dashboard do mês',
    texto:
      'Saldo, receitas, despesas e taxa de gasto de cada mês, com a evolução dos últimos 4 meses e as despesas por categoria.',
  },
  {
    Icone: FileUp,
    titulo: 'Importação CSV',
    texto: 'Traga vários lançamentos de uma planilha e veja o motivo de cada linha ignorada.',
  },
  { Icone: Tags, titulo: 'Categorias', texto: 'Crie as suas e use mais de uma no mesmo lançamento.' },
  { Icone: Download, titulo: 'Exportar', texto: 'Baixe seus lançamentos em CSV ou Excel, com os filtros da lista.' },
  { Icone: SunMoon, titulo: 'Claro ou escuro', texto: 'Segue o tema do aparelho, e você troca no Perfil.' },
]

export function LandingBeneficios() {
  return (
    <section aria-labelledby="ben-titulo" className="bg-secondary mb-6 px-5 py-8 lg:mb-0 lg:py-20">
      <div className="max-w-conteudo mx-auto flex flex-col gap-4 md:px-3 lg:gap-6">
        <div className="flex max-w-[640px] flex-col gap-2">
          <p className="text-rotulo-secao text-muted-foreground uppercase">O que o PoupaMais faz</p>
          <h2 id="ben-titulo" className="text-titulo-1 lg:text-[32px] lg:leading-10">
            Tudo o que você precisa para fechar o mês
          </h2>
        </div>
        <ul className="bg-card border-border rounded-card shadow-card flex flex-col border px-4 lg:grid lg:grid-cols-6 lg:gap-4 lg:border-0 lg:bg-transparent lg:px-0 lg:shadow-none">
          {ITENS.map(({ Icone, titulo, texto }) => (
            <li
              key={titulo}
              className="border-border lg:rounded-grande lg:bg-card lg:shadow-card flex items-start gap-4 border-t py-4 first:border-t-0 lg:col-span-2 lg:flex-col lg:gap-3 lg:border lg:p-6 lg:first:border-t lg:[&:nth-child(n+4)]:col-span-3"
            >
              <FunctionIcon funcao="primaria" icone={Icone} />
              <div className="flex min-w-0 flex-col gap-1 lg:gap-3">
                <h3 className="text-titulo-3">{titulo}</h3>
                <p className="text-corpo text-muted-foreground">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
