import type { ReactNode } from 'react'

// Página de formulário (Novo/Editar lançamento e afins), dentro do AppShellTemplate (DS: Navegação e layout, Formulários).
// - Celular: tela inteira, com as ações FIXAS no rodapé (acima da área segura). A tela não passa a BottomNav ao AppShell.
//   Título e "‹ Voltar" ficam na TopBar; por isso o cabeçalho daqui só aparece a partir de 768px.
// - A partir de 768px: título e descrição acima do card centralizado; no card, o conteúdo e as ações alinhadas à direita,
//   separadas por uma divisória.
// Pranchetas: ../Documentação/design/telas/project/novo-*.dc.html e editar-*.dc.html.
export type FormPageTemplateProps = {
  titulo: string
  /** Frase curta abaixo do título (≥ 768px) */
  descricao?: string
  /** Link "‹ Voltar para Lançamentos" (≥ 768px) */
  voltar?: ReactNode
  /** Faixa no topo do card (aviso de lixeira, OfflineBanner, erro de rede) */
  aviso?: ReactNode
  /** Campos do formulário */
  children: ReactNode
  /** Botões: "Salvar lançamento" (o único preenchido) e as ações secundárias */
  acoes?: ReactNode
}

export function FormPageTemplate({ titulo, descricao, voltar, aviso, children, acoes }: FormPageTemplateProps) {
  return (
    <div data-slot="form-page-template" className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
      {voltar && <div className="hidden md:block">{voltar}</div>}
      <header className="hidden flex-col gap-1 md:flex">
        <h1 id="form-page-titulo" className="text-titulo-1">
          {titulo}
        </h1>
        {descricao && <p className="text-corpo text-muted-foreground">{descricao}</p>}
      </header>
      <section
        aria-labelledby="form-page-titulo"
        className="md:bg-card md:text-card-foreground md:border-border md:rounded-grande md:shadow-card flex flex-col gap-6 md:border md:p-6"
      >
        {aviso}
        <div className="flex flex-col gap-4">{children}</div>
        {acoes && (
          <div
            data-slot="form-page-acoes"
            className="bg-background border-border fixed inset-x-0 bottom-0 z-30 flex flex-col-reverse gap-3 border-t px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] md:static md:-mx-6 md:-mb-6 md:flex-row md:flex-wrap md:justify-end md:border-t md:bg-transparent md:px-6 md:py-4"
          >
            {acoes}
          </div>
        )}
      </section>
      {/* espaço para o rodapé fixo não cobrir o último campo no celular */}
      {acoes && <div aria-hidden="true" className="h-24 md:hidden" />}
    </div>
  )
}
