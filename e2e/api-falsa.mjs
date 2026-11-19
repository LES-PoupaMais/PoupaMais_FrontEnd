// API falsa para os E2E das Server Actions (troca de senha e exclusão de conta), que chamam a API pelo SERVIDOR do Next
// e por isso não passam pelo page.route do navegador. O Playwright sobe este servidor e o Next aponta para ele (API_URL).
// Sem estado: a senha "senha-errada" responde 422, como a API real; qualquer outra dá certo.
import { createServer } from 'node:http'

const porta = Number(process.argv[2] ?? 4000)
const SENHA_ERRADA = 'senha-errada'

function responder(res, status, corpo) {
  res.writeHead(status, corpo === undefined ? {} : { 'Content-Type': 'application/json' })
  res.end(corpo === undefined ? undefined : JSON.stringify(corpo))
}

createServer((req, res) => {
  let texto = ''
  req.on('data', (parte) => (texto += parte))
  req.on('end', () => {
    if (req.url === '/saude') return responder(res, 200, { ok: true })
    // Rotas públicas de autenticação (telas de acesso). "senha-errada" no login → 401; "usado@poupamais.com.br" no
    // cadastro → 409; token "token-expirado" ao redefinir → 422; recuperar a senha → 202 sempre (RN014).
    if (req.method === 'POST' && req.url?.startsWith('/api/auth/')) {
      const dados = texto ? JSON.parse(texto) : {}
      if (req.url === '/api/auth/login') {
        if (dados.senha === SENHA_ERRADA)
          return responder(res, 401, { status: 401, mensagem: 'E-mail ou senha inválidos' })
        return responder(res, 200, {
          token: 'token-login-e2e',
          expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
          usuario: { id: 1, nome: 'Usuário Demo', email: dados.email },
        })
      }
      if (req.url === '/api/auth/cadastro') {
        if (dados.email === 'usado@poupamais.com.br')
          return responder(res, 409, { status: 409, mensagem: 'Este e-mail já está cadastrado' })
        return responder(res, 201, { id: 2, nome: dados.nome, email: dados.email })
      }
      if (req.url === '/api/auth/recuperar-senha') return responder(res, 202)
      if (req.url === '/api/auth/redefinir-senha') {
        if (dados.token === 'token-expirado') return responder(res, 422, { status: 422, mensagem: 'Token inválido' })
        return responder(res, 204)
      }
    }
    if (!req.headers.authorization) return responder(res, 401, { status: 401, mensagem: 'Sessão expirada' })
    const corpo = texto ? JSON.parse(texto) : {}

    if (req.method === 'PUT' && req.url === '/api/usuarios/me/senha') {
      if (corpo.senhaAtual === SENHA_ERRADA) {
        return responder(res, 422, { status: 422, mensagem: 'A senha atual está incorreta' })
      }
      return responder(res, 200, {
        token: 'token-novo-e2e',
        expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
      })
    }
    if (req.method === 'POST' && req.url === '/api/usuarios/me/excluir') {
      if (corpo.senha === SENHA_ERRADA) return responder(res, 422, { status: 422, mensagem: 'Senha incorreta' })
      return responder(res, 204)
    }
    return responder(res, 404, { status: 404, mensagem: 'Não encontrado' })
  })
}).listen(porta)
