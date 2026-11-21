import { http, type ArquivoBaixado } from '@/lib/http'
import type { AtualizarUsuarioRequest, Usuario } from '@/types/api'

// Perfil via BFF. Troca de senha e exclusão de conta NÃO passam por aqui: são Server Actions (mexem no cookie).
export const usuarioService = {
  obter: () => http.get<Usuario>('/usuarios/me'),

  atualizar: (dados: AtualizarUsuarioRequest) => http.put<Usuario>('/usuarios/me', { corpo: dados }),

  /** JPG, PNG ou WEBP até 2 MB (RN015): valide antes de enviar */
  trocarFoto: (foto: File) => {
    const formulario = new FormData()
    formulario.append('foto', foto)
    return http.put<void>('/usuarios/me/foto', { corpo: formulario })
  },

  removerFoto: () => http.delete<void>('/usuarios/me/foto'),

  /** URL da foto com versão para furar o cache depois de trocar */
  urlDaFoto: (versao: number | string) => `/api/usuarios/me/foto?v=${versao}`,

  /** "Baixar meus dados" (LGPD): meus-dados-poupamais.json */
  baixarDados: (): Promise<ArquivoBaixado> => http.baixar('/usuarios/me/dados'),
}
