// Rotas da aplicação. Use estas constantes em links e redirecionamentos.
export const ROTAS = {
  inicio: '/',
  privacidade: '/privacidade',
  login: '/login',
  cadastro: '/cadastro',
  esqueciSenha: '/esqueci-senha',
  redefinirSenha: '/redefinir-senha',
  dashboard: '/dashboard',
  lancamentos: '/lancamentos',
  novoLancamento: '/lancamentos/novo',
  importar: '/lancamentos/importar',
  lixeira: '/lancamentos/lixeira',
  categorias: '/categorias',
  perfil: '/perfil',
  lancamento: (id: number) => `/lancamentos/${id}`,
  editarLancamento: (id: number) => `/lancamentos/${id}/editar`,
} as const
