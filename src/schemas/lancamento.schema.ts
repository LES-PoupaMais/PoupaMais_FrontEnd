import { z } from 'zod'
import { ANO_MAXIMO, ANO_MINIMO, ehDataIsoValida, mensagemDataForaDaFaixa, partesDaData } from '@/lib/data'

// RN001 (revista em 18/11/2026): descrição obrigatória (até 100), tipo, DATA (dia que exista, de 01/01/2000 a 31/12/2100),
// valor maior que zero (até R$ 999.999.999,99) e pelo menos uma categoria. A data trafega como "AAAA-MM-DD"
// (o DatePicker devolve nesse formato; a tela mostra dd/mm/aaaa).
export const VALOR_MAXIMO = 999_999_999.99
export const DESCRICAO_MAXIMO = 100

// Mensagens do Design System e da prancheta novo-erros-celular (decisão de 20/11): Input, SegmentedControl, DatePicker,
// MoneyField (com o limite de R$ 999.999.999,99) e MultiSelect. Sem frase no DS: data vazia.
export const MENSAGENS_LANCAMENTO = {
  descricaoObrigatoria: 'A descrição é obrigatória.',
  descricaoLonga: `A descrição deve ter no máximo ${DESCRICAO_MAXIMO} caracteres.`,
  tipo: 'Escolha Receita ou Despesa.',
  dataObrigatoria: 'Informe a data.',
  dataInvalida: 'Informe uma data válida, no formato dd/mm/aaaa.',
  // fora da faixa: a mesma frase do DatePicker (lib/data)
  dataFaixa: mensagemDataForaDaFaixa(),
  // MoneyField: vazio e zero têm a mesma frase
  valorObrigatorio: 'Informe um valor maior que zero.',
  valorPositivo: 'Informe um valor maior que zero.',
  valorMaximo: 'O valor máximo é R$ 999.999.999,99.',
  categorias: 'Informe pelo menos uma categoria.',
} as const

const m = MENSAGENS_LANCAMENTO

export const dataLancamentoSchema = z
  .string({ error: m.dataObrigatoria })
  .min(1, m.dataObrigatoria)
  // cada regra só reclama do que é dela: data vazia mostra só "Informe a data."
  .refine((iso) => iso === '' || ehDataIsoValida(iso), m.dataInvalida)
  .refine((iso) => {
    if (!ehDataIsoValida(iso)) return true
    const { ano } = partesDaData(iso)
    return ano >= ANO_MINIMO && ano <= ANO_MAXIMO
  }, m.dataFaixa)

export const lancamentoSchema = z.object({
  descricao: z
    .string({ error: m.descricaoObrigatoria })
    .trim()
    .min(1, m.descricaoObrigatoria)
    .max(DESCRICAO_MAXIMO, m.descricaoLonga),
  tipo: z.enum(['RECEITA', 'DESPESA'], { error: m.tipo }),
  data: dataLancamentoSchema,
  valor: z
    .number({ error: m.valorObrigatorio })
    .positive(m.valorPositivo)
    .max(VALOR_MAXIMO, m.valorMaximo)
    .multipleOf(0.01, m.valorObrigatorio),
  categoriaIds: z.array(z.number().int().positive(), { error: m.categorias }).min(1, m.categorias),
})

export type LancamentoInput = z.input<typeof lancamentoSchema>
export type LancamentoDados = z.output<typeof lancamentoSchema>
