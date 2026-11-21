import { ErrorState } from '@/components/molecules/error-state'
import { PublicTemplate } from '@/components/templates/public-template'
import { ROTAS } from '@/constants/rotas'

// 404 (pranchetas nao-encontrado-celular e -computador): topo só com o logo, ErrorState "nao-encontrado" centralizado.
// Logado: "Voltar ao início" leva ao Dashboard e há "Ver lançamentos"; deslogado: volta para a página inicial.
export function NaoEncontradoView({ logado }: { logado: boolean }) {
  return (
    <PublicTemplate variante="site" acoes={null} rodape={null} hrefLogo={logado ? ROTAS.dashboard : ROTAS.inicio}>
      <div className="flex flex-1 items-center justify-center px-5 py-5 md:px-8 md:py-12">
        <ErrorState
          tipo="nao-encontrado"
          className="w-full max-w-[480px]"
          href={logado ? ROTAS.dashboard : ROTAS.inicio}
          texto={logado ? 'O endereço pode ter mudado ou não existe mais. Seus dados continuam guardados.' : undefined}
          acaoSecundaria={logado ? { rotulo: 'Ver lançamentos', href: ROTAS.lancamentos } : undefined}
        />
      </div>
    </PublicTemplate>
  )
}
