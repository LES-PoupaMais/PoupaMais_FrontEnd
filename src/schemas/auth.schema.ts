import { z } from 'zod'

// Login e cadastro (RN011): nome até 150, e-mail válido até 100, senha de 6 a 72 caracteres (limite do BCrypt),
// confirmação igual e aceite da Política. Mesmos limites do back.
export const SENHA_MINIMO = 6
export const SENHA_MAXIMO = 72

const email = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .min(1, 'Informe o e-mail.')
  .max(100, 'O e-mail pode ter até 100 caracteres.')
  .pipe(z.email('Informe um e-mail válido.'))

export const loginSchema = z.object({
  email,
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
})

export const cadastroSchema = z
  .object({
    nome: z
      .string({ error: 'Informe seu nome.' })
      .trim()
      .min(1, 'Informe seu nome.')
      .max(150, 'O nome pode ter até 150 caracteres.'),
    email,
    senha: z
      .string({ error: 'Informe a senha.' })
      .min(SENHA_MINIMO, `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
      .max(SENHA_MAXIMO, `A senha pode ter até ${SENHA_MAXIMO} caracteres.`),
    confirmarSenha: z.string({ error: 'Confirme a senha.' }).min(1, 'Confirme a senha.'),
    aceiteTermos: z.boolean().refine((aceito) => aceito, 'Para criar a conta, aceite a Política de Privacidade.'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não são iguais.',
  })

export type LoginInput = z.input<typeof loginSchema>
export type CadastroInput = z.input<typeof cadastroSchema>
