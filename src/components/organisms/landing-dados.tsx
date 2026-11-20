import { ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/atoms/button'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { cn } from '@/lib/cn'

// "Seus dados ficam com você" (landing): card com o link para a Política; no computador, também "Criar conta".
export type LandingDadosProps = { hrefPrivacidade: string; hrefCadastro: string }

export function LandingDados({ hrefPrivacidade, hrefCadastro }: LandingDadosProps) {
  return (
    <section aria-labelledby="priv-titulo" className="px-5 pb-6 lg:pt-8 lg:pb-24">
      <div className="max-w-conteudo mx-auto md:px-3">
        <div className="bg-card border-border rounded-grande shadow-card flex flex-col gap-3 border p-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-6 lg:p-8">
          <div className="grid max-w-[680px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:items-start lg:gap-x-4 lg:gap-y-2">
            <FunctionIcon funcao="receita" icone={ShieldCheck} className="lg:row-span-2" />
            <h2 id="priv-titulo" className="text-titulo-2">
              Seus dados ficam com você
            </h2>
            <p className="text-corpo text-muted-foreground col-span-2 lg:col-span-1 lg:col-start-2">
              Não vendemos nem compartilhamos seus dados. No Perfil, você baixa uma cópia de tudo ou exclui a conta
              quando quiser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={hrefPrivacidade}
              className={cn(buttonVariants({ variant: 'texto' }), '-ml-3 self-start underline lg:ml-0')}
            >
              Ler a Política de privacidade
              <ArrowRight aria-hidden="true" className="lg:hidden" />
            </Link>
            <Link
              href={hrefCadastro}
              className={cn(buttonVariants({ variant: 'contornado' }), 'hidden lg:inline-flex')}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
