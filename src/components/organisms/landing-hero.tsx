import { ArrowRight, CalendarDays, Info, Percent, ShieldCheck, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/atoms/badge'
import { buttonVariants } from '@/components/atoms/button'
import { MoneyText } from '@/components/atoms/money-text'
import { StatCard } from '@/components/molecules/stat-card'
import { formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/cn'

// Topo da landing (pranchetas landing-celular e landing-computador): sobretítulo, título, texto, "Criar conta" e
// "Já tenho conta", e a prévia do Início com dados de exemplo (o Saldo do mês e os tiles). Estático.
export type LandingHeroProps = { hrefCadastro: string; hrefLogin: string }

export function LandingHero({ hrefCadastro, hrefLogin }: LandingHeroProps) {
  return (
    <section aria-labelledby="hero-titulo" className="px-5 py-6 lg:py-24">
      <div className="max-w-conteudo mx-auto grid gap-6 md:px-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <div className="flex flex-col gap-4 lg:gap-5">
          <p className="text-receita text-[12px] leading-4 font-extrabold tracking-[.08em] uppercase">
            Gestão financeira pessoal e familiar
          </p>
          <h1 id="hero-titulo" className="text-display text-[34px] leading-10 lg:text-[52px] lg:leading-15">
            Veja para onde vai o seu dinheiro <span className="text-receita">em cada mês.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-6 font-medium lg:max-w-[52ch] lg:text-lg lg:leading-7">
            Registre receitas e despesas com a data de cada uma, organize por categorias e acompanhe o saldo mês a mês,
            no celular ou no computador.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={hrefCadastro} className={cn(buttonVariants({ variant: 'primario' }), 'w-full sm:w-auto')}>
              Criar conta
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href={hrefLogin} className={cn(buttonVariants({ variant: 'contornado' }), 'w-full sm:w-auto')}>
              Já tenho conta
            </Link>
          </div>
          <p className="text-legenda text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Você pode baixar ou excluir seus dados quando quiser.
          </p>
        </div>
        <div className="lg:bg-secondary lg:rounded-grande lg:p-6">
          <LandingPrevia />
        </div>
      </div>
    </section>
  )
}

/** Prévia do Início com dados de exemplo (não são dados da pessoa). */
function LandingPrevia() {
  return (
    <figure aria-label="Prévia do Início com dados de exemplo" className="flex flex-col gap-3">
      <article
        aria-label="Saldo do mês de novembro de 2026"
        className="rounded-grande border-destaque-borda bg-destaque-card text-sobre-destaque-card shadow-card flex flex-col gap-3 border p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-rotulo-secao uppercase">Saldo do mês</p>
          <span className="text-legenda flex items-center gap-1">
            <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Novembro 2026
          </span>
        </div>
        <MoneyText valor={4920} tipo="RECEITA" tamanho="destaque" ajustar className="text-destaque-positivo" />
        <p className="text-corpo">Você fechou o mês com {formatarMoeda(4920)} positivos.</p>
      </article>
      <div role="list" aria-label="Resumo de novembro de 2026" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard funcao="receita" rotulo="Receitas" valor={formatarMoeda(12480.5)} />
        <StatCard funcao="despesa" rotulo="Despesas" valor={formatarMoeda(7560.5)} />
        <StatCard
          className="hidden lg:flex"
          icone={Percent}
          rotulo="Taxa de gasto"
          valor="60,6%"
          rodape={
            <Badge variant="receita">
              <TrendingUp aria-hidden="true" />
              Dentro do limite
            </Badge>
          }
        />
      </div>
      <figcaption className="text-legenda text-muted-foreground flex items-center gap-1">
        <Info className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Prévia com dados de exemplo.
      </figcaption>
    </figure>
  )
}
