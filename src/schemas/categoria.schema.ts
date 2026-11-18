import { z } from 'zod'

// Categoria (RN002): descrição sem espaços nas pontas, obrigatória, até 255 caracteres.
// Duplicada (sem diferenciar maiúsculas) a API responde 409: a tela mostra no próprio diálogo.
export const categoriaSchema = z.object({
  descricao: z
    .string({ error: 'Informe o nome da categoria.' })
    .trim()
    .min(1, 'Informe o nome da categoria.')
    .max(255, 'O nome pode ter até 255 caracteres.'),
})

export type CategoriaInput = z.input<typeof categoriaSchema>
