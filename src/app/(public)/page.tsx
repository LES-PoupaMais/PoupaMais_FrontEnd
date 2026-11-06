import { ArrowRight, ChartColumn, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/atoms/badge'
import { buttonVariants } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'

// Landing (protótipo: image6). Será quebrada em organismos (HeroSection, FeaturesSection) no card de telas.
const destaques = [
  {
    icone: ChartColumn,
    titulo: 'Dashboard inteligente',
    texto: 'Visualize receitas, despesas e saldo em gráficos claros que revelam onde seu dinheiro vai.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Controle total',
    texto: 'Cadastre, edite e ative ou desative lançamentos com facilidade. Você decide o que conta.',
  },
  {
    icone: Zap,
    titulo: 'Importação em lote',
    texto: 'Importe seus extratos via CSV e organize meses de lançamentos em segundos.',
  },
]

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20 text-center">
      <Badge variant="outline" className="border-marca/40 bg-marca/10 text-marca">
        Controle financeiro pessoal
      </Badge>
      <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
        Pare de perder dinheiro <span className="text-marca">sem perceber.</span>
      </h1>
      <p className="text-muted-foreground mt-6 max-w-xl text-lg">
        O PoupaMais mostra exatamente onde você está errando nas finanças, com clareza e sem complicação.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/cadastro" className={buttonVariants({ variant: 'success', size: 'xl' })}>
          Começar gratuitamente
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'xl' })}>
          Já tenho conta
        </Link>
      </div>

      <ul className="mt-20 grid w-full max-w-5xl gap-4 text-left md:grid-cols-3">
        {destaques.map(({ icone: Icone, titulo, texto }) => (
          <li key={titulo}>
            <Card className="h-full">
              <CardHeader>
                <Icone className="bg-marca/15 text-marca size-9 rounded-lg p-2" aria-hidden="true" />
                <CardTitle>
                  <h2>{titulo}</h2>
                </CardTitle>
                <CardDescription>{texto}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </li>
        ))}
      </ul>
    </main>
  )
}
