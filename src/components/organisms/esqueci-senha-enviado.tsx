'use client'

import Link from 'next/link'
import { Button, buttonVariants } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { cn } from '@/lib/cn'

// Pedido de link enviado (prancheta esqueci-enviado-celular). RN014: o texto nunca diz se a conta existe.
// O título e o "Pedido recebido para…" ficam no template; aqui vão o aviso, as dicas e as duas saídas.
export type EsqueciSenhaEnviadoProps = {
  hrefLogin: string
  /** Volta ao formulário com o mesmo e-mail */
  onEnviarDeNovo: () => void
}

export function EsqueciSenhaEnviado({ hrefLogin, onEnviarDeNovo }: EsqueciSenhaEnviadoProps) {
  return (
    <div data-slot="esqueci-senha-enviado" className="flex flex-col gap-6">
      <ActionBanner texto="Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha." />
      <ul className="text-corpo text-muted-foreground flex list-disc flex-col gap-2 pl-5 text-left">
        <li>O link vale por 30 minutos e funciona uma vez só.</li>
        <li>Não chegou? Confira a caixa de spam ou peça de novo. Um pedido novo cancela os anteriores.</li>
      </ul>
      <div className="flex flex-col gap-3">
        <Link href={hrefLogin} className={cn(buttonVariants({ variant: 'primario' }), 'w-full')}>
          Voltar para o login
        </Link>
        <Button variant="contornado" className="w-full" onClick={onEnviarDeNovo}>
          Enviar de novo
        </Button>
      </div>
    </div>
  )
}
