import { z } from 'zod'
import { SENHA_MAXIMO, SENHA_MINIMO } from './auth.schema'

// Perfil (RN015/RN016): nome até 150 (e-mail não editável), troca de senha (nova segue a RN011 e é diferente da atual),
// foto JPG/PNG/WEBP até 2 MB conferida antes de enviar e a senha exigida para excluir a conta. Mesmos limites do back.

export const NOME_MAXIMO = 150

export const nomeSchema = z.object({
  nome: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(1, 'Informe seu nome.')
    .max(NOME_MAXIMO, `O nome pode ter até ${NOME_MAXIMO} caracteres.`),
})

export const MENSAGEM_SENHA_IGUAL = 'A nova senha deve ser diferente da atual.'

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string({ error: 'Informe a senha atual.' }).min(1, 'Informe a senha atual.'),
    novaSenha: z
      .string({ error: 'Informe a nova senha.' })
      .min(SENHA_MINIMO, `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
      .max(SENHA_MAXIMO, `A senha pode ter até ${SENHA_MAXIMO} caracteres.`),
    confirmarSenha: z.string({ error: 'Confirme a nova senha.' }).min(1, 'Confirme a nova senha.'),
  })
  .refine((dados) => dados.novaSenha !== dados.senhaAtual, { path: ['novaSenha'], message: MENSAGEM_SENHA_IGUAL })
  .refine((dados) => !dados.confirmarSenha || dados.novaSenha === dados.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não são iguais.',
  })

export const PALAVRA_EXCLUIR_CONTA = 'EXCLUIR'

export const excluirContaSchema = z.object({
  senha: z.string({ error: 'Informe sua senha.' }).min(1, 'Informe sua senha.'),
})

export const FOTO_TIPOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const FOTO_MAXIMO_BYTES = 2 * 1024 * 1024

/** RN015: confere tipo e tamanho antes de enviar. Devolve a mensagem de erro ou `null` se a foto pode ir. */
export function validarFoto(arquivo: Pick<File, 'type' | 'size'>): string | null {
  if (!(FOTO_TIPOS as readonly string[]).includes(arquivo.type)) return 'A foto deve ser uma imagem JPG, PNG ou WEBP.'
  if (arquivo.size > FOTO_MAXIMO_BYTES) return 'A foto deve ter no máximo 2 MB. Escolha uma imagem menor.'
  return null
}

export type NomeInput = z.input<typeof nomeSchema>
export type TrocarSenhaInput = z.input<typeof trocarSenhaSchema>
export type ExcluirContaInput = z.input<typeof excluirContaSchema>
