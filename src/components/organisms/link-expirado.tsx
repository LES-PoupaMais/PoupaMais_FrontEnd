import Link from 'next/link'
import { buttonVariants } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Saídas do link de redefinição expirado, inválido ou já usado (prancheta redefinir-expirado-celular).
// O título "Este link expirou" e a explicação ficam no template.
export type LinkExpiradoProps = { hrefPedirOutro: string; hrefLogin: string }

export function LinkExpirado({ hrefPedirOutro, hrefLogin }: LinkExpiradoProps) {
  return (
    <div data-slot="link-expirado" className="flex flex-col gap-3">
      <Link href={hrefPedirOutro} className={cn(buttonVariants({ variant: 'primario' }), 'w-full')}>
        Pedir outro link
      </Link>
      <Link href={hrefLogin} className={cn(buttonVariants({ variant: 'texto' }), 'w-full')}>
        Voltar para o login
      </Link>
    </div>
  )
}
