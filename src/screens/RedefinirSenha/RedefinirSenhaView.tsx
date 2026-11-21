'use client'

import { LockKeyhole, TimerOff } from 'lucide-react'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { LinkExpirado } from '@/components/organisms/link-expirado'
import { RedefinirSenhaForm } from '@/components/organisms/redefinir-senha-form'
import { AuthTemplate } from '@/components/templates/auth-template'
import { useRedefinirSenhaContext } from './RedefinirSenhaContext'

// Pranchetas redefinir-celular e redefinir-expirado-celular.
export function RedefinirSenhaView() {
  const { linkExpirado, enviando, erro, online, hrefPedirOutro, hrefLogin, salvar } = useRedefinirSenhaContext()

  if (linkExpirado) {
    return (
      <AuthTemplate
        titulo="Este link expirou"
        subtitulo="Por segurança, o link para redefinir a senha vale por 30 minutos e só pode ser usado uma vez. Peça outro para continuar."
        icone={{ Icone: TimerOff, tom: 'erro' }}
      >
        <LinkExpirado hrefPedirOutro={hrefPedirOutro} hrefLogin={hrefLogin} />
      </AuthTemplate>
    )
  }

  return (
    <AuthTemplate
      titulo="Criar nova senha"
      subtitulo="Escolha uma senha nova para a sua conta. Depois, você entra com ela."
      icone={{ Icone: LockKeyhole, tom: 'primaria' }}
      aviso={!online && <OfflineBanner variante="canto" />}
    >
      <RedefinirSenhaForm onSubmit={salvar} enviando={enviando} erro={erro} semConexao={!online} />
    </AuthTemplate>
  )
}
