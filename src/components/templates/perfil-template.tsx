import type { ReactNode } from 'react'

// Página do Perfil (pranchetas perfil-celular e perfil-computador), dentro do AppShellTemplate.
// - Celular: 1 coluna com 16px entre os cards, nesta ordem: principal (foto, dados, senha), lateral (aparência, seus
//   lançamentos, privacidade) e o rodapé ("Sair da conta", só no celular: a partir de 768px o Sair fica na sidebar).
// - A partir de 768px: cabeçalho (título + frase) e 24px entre os cards. As duas colunas só aparecem quando cabem com
//   pelo menos 420px cada (container query, como o `auto-fit minmax(420px)` da prancheta): no tablet fica 1 coluna.
export type PerfilTemplateProps = {
  /** Título "Perfil" e a frase (≥ 768px; no celular o título fica na TopBar) */
  cabecalho?: ReactNode
  /** Faixas no topo (OfflineBanner e o motivo) */
  aviso?: ReactNode
  /** Coluna da esquerda: foto, dados e senha */
  principal?: ReactNode
  /** Coluna da direita: aparência, seus lançamentos e privacidade */
  lateral?: ReactNode
  /** Só no celular: "Sair da conta" */
  rodape?: ReactNode
  /** Substitui as colunas: ErrorState quando o perfil não carregou */
  estado?: ReactNode
}

export function PerfilTemplate({ cabecalho, aviso, principal, lateral, rodape, estado }: PerfilTemplateProps) {
  return (
    <div data-slot="perfil-template" className="@container flex flex-col gap-4 md:gap-6">
      {cabecalho && (
        <div data-slot="perfil-cabecalho" className="hidden flex-col gap-1 md:flex">
          {cabecalho}
        </div>
      )}
      {aviso && (
        <div data-slot="perfil-aviso" className="flex flex-col gap-2">
          {aviso}
        </div>
      )}
      {estado ? (
        <div data-slot="perfil-estado">{estado}</div>
      ) : (
        <>
          <div
            data-slot="perfil-colunas"
            className="grid grid-cols-1 items-start gap-4 md:gap-6 @min-[864px]:grid-cols-2"
          >
            <div data-slot="perfil-principal" className="flex min-w-0 flex-col gap-4 md:gap-6">
              {principal}
            </div>
            <div data-slot="perfil-lateral" className="flex min-w-0 flex-col gap-4 md:gap-6">
              {lateral}
            </div>
          </div>
          {rodape && (
            <div data-slot="perfil-rodape" className="md:hidden">
              {rodape}
            </div>
          )}
        </>
      )}
    </div>
  )
}
