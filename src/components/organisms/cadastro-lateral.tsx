import { FileUp, LayoutDashboard, ShieldCheck, type LucideIcon } from 'lucide-react'
import { FunctionIcon } from '@/components/atoms/function-icon'

// Texto de apoio do cadastro no computador (prancheta cadastro-computador, coluna da esquerda). Estático; prometa só o que o
// sistema faz (DS, Voz e texto).
const ITENS: { Icone: LucideIcon; titulo: string; texto: string }[] = [
  { Icone: LayoutDashboard, titulo: 'O mês inteiro numa tela', texto: 'Saldo, receitas, despesas e taxa de gasto.' },
  { Icone: FileUp, titulo: 'Traga a sua planilha', texto: 'Importe lançamentos em CSV, com modelo pronto.' },
  { Icone: ShieldCheck, titulo: 'Seus dados são seus', texto: 'Baixe uma cópia ou exclua a conta no Perfil.' },
]

export function CadastroLateral() {
  return (
    <div data-slot="cadastro-lateral" className="flex flex-col gap-6">
      <p className="text-receita text-[12px] leading-4 font-extrabold tracking-[.08em] uppercase">
        Gestão financeira pessoal e familiar
      </p>
      <h2 className="text-display text-[40px] leading-12">
        Comece a organizar o seu dinheiro <span className="text-receita">pelo mês atual.</span>
      </h2>
      <ul className="flex flex-col gap-5">
        {ITENS.map(({ Icone, titulo, texto }) => (
          <li key={titulo} className="flex items-start gap-4">
            <FunctionIcon funcao="primaria" icone={Icone} />
            <div className="flex flex-col gap-0.5">
              <span className="text-corpo-forte">{titulo}</span>
              <span className="text-corpo text-muted-foreground">{texto}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
