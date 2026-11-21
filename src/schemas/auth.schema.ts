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
  .pipe(z.email('Informe um e-mail válido, como voce@email.com.'))

// Senha nova (cadastro e redefinir): mensagens das pranchetas cadastro-validacao e redefinir.
const senhaNova = z
  .string({ error: 'Informe a senha.' })
  .min(SENHA_MINIMO, `A senha deve ter pelo menos ${SENHA_MINIMO} caracteres.`)
  .max(SENHA_MAXIMO, `A senha pode ter até ${SENHA_MAXIMO} caracteres.`)

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
    senha: senhaNova,
    confirmarSenha: z.string({ error: 'Confirme a senha.' }).min(1, 'Confirme a senha.'),
    aceiteTermos: z.boolean().refine((aceito) => aceito, 'Para criar a conta, aceite a Política de Privacidade.'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não são iguais.',
  })

// Esqueci a senha (RN014): só o e-mail. A resposta é sempre a mesma, exista a conta ou não.
export const recuperarSenhaSchema = z.object({ email })

// Redefinir senha (link do e-mail): nova senha com confirmação. O token vem da URL, fora do formulário.
export const redefinirSenhaSchema = z
  .object({
    novaSenha: senhaNova,
    confirmarSenha: z.string({ error: 'Confirme a senha.' }).min(1, 'Confirme a senha.'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não são iguais.',
  })

export type LoginInput = z.input<typeof loginSchema>
export type CadastroInput = z.input<typeof cadastroSchema>
export type RecuperarSenhaInput = z.input<typeof recuperarSenhaSchema>
export type RedefinirSenhaInput = z.input<typeof redefinirSenhaSchema>
