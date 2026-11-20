import { ArrowLeft, Database, Mail, Share2, Target, UserCog, UserRound, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'

// Política de privacidade (pranchetas privacidade-celular e privacidade-computador): índice "Nesta página" fixo à esquerda
// no computador e o texto num card; no celular, o texto direto na página. Linguagem simples, sem prometer o que o sistema
// não faz. A seção "Contato" é PROVISÓRIA: o canal do encarregado (DPO) ainda não foi definido (Pendências do CLAUDE.md).
export type PoliticaPrivacidadeProps = { hrefInicio: string; hrefLogin: string }

type Secao = { id: string; titulo: string; Icone: LucideIcon; corpo: ReactNode }

const Lista = ({ children, ordenada = false }: { children: ReactNode; ordenada?: boolean }) => {
  const Tag = ordenada ? 'ol' : 'ul'
  return (
    <Tag
      className={`text-corpo marker:text-muted-foreground flex flex-col gap-2 pl-5 ${ordenada ? 'list-decimal' : 'list-disc'}`}
    >
      {children}
    </Tag>
  )
}

const SECOES: Secao[] = [
  {
    id: 'dados',
    titulo: 'Quais dados coletamos',
    Icone: Database,
    corpo: (
      <>
        <p>Coletamos só o necessário para o PoupaMais funcionar:</p>
        <Lista>
          <li>
            <strong>Dados da conta:</strong> nome e e-mail, informados no cadastro.
          </li>
          <li>
            <strong>Senha:</strong> guardada de forma cifrada (hash). Ninguém da equipe consegue ver a sua senha.
          </li>
          <li>
            <strong>Foto de perfil:</strong> opcional. Você envia, troca ou remove quando quiser.
          </li>
          <li>
            <strong>Lançamentos e categorias:</strong> descrição, data, valor, tipo e categorias que você registra ou
            importa.
          </li>
          <li>
            <strong>Aceite desta política:</strong> a data em que você aceitou, no cadastro.
          </li>
        </Lista>
        <p>Não pedimos CPF, dados de cartão nem acesso à sua conta no banco.</p>
      </>
    ),
  },
  {
    id: 'finalidade',
    titulo: 'Para que usamos',
    Icone: Target,
    corpo: (
      <>
        <Lista>
          <li>Entrar na sua conta e manter a sua sessão.</li>
          <li>Mostrar o dashboard do mês, a lista de lançamentos e as suas categorias.</li>
          <li>Importar e exportar os seus lançamentos quando você pedir.</li>
          <li>Enviar o link de redefinição de senha quando você pedir.</li>
        </Lista>
        <p>Não usamos os seus dados para publicidade nem para recomendar produtos financeiros.</p>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    titulo: 'Não compartilhamos seus dados',
    Icone: Share2,
    corpo: (
      <p>
        Os seus dados não são vendidos, alugados nem compartilhados com outras empresas. Cada pessoa só vê os próprios
        lançamentos e categorias.
      </p>
    ),
  },
  {
    id: 'direitos',
    titulo: 'Seus direitos (LGPD)',
    Icone: UserRound,
    corpo: (
      <>
        <p>Pela Lei Geral de Proteção de Dados, você pode:</p>
        <Lista>
          <li>
            <strong>Acessar</strong> os dados que temos sobre você.
          </li>
          <li>
            <strong>Corrigir</strong> dados incompletos ou errados.
          </li>
          <li>
            <strong>Levar</strong> os seus dados com você, num arquivo.
          </li>
          <li>
            <strong>Excluir</strong> a sua conta e todos os seus dados.
          </li>
        </Lista>
      </>
    ),
  },
  {
    id: 'perfil',
    titulo: 'Como exercer no Perfil',
    Icone: UserCog,
    corpo: (
      <>
        <p>
          Tudo isso fica no <strong>Perfil</strong>, sem precisar pedir para ninguém:
        </p>
        <Lista ordenada>
          <li>
            <strong>Dados:</strong> veja o seu nome e e-mail e corrija o nome. O e-mail não pode ser alterado.
          </li>
          <li>
            <strong>Privacidade &gt; Baixar meus dados:</strong> baixa um arquivo com o seu perfil, as suas categorias e
            todos os seus lançamentos, inclusive os da lixeira.
          </li>
          <li>
            <strong>Privacidade &gt; Excluir minha conta:</strong> apaga a conta, os lançamentos, as categorias e a
            foto. Pedimos a sua senha para confirmar, e não dá para desfazer.
          </li>
        </Lista>
      </>
    ),
  },
  {
    id: 'contato',
    titulo: 'Contato',
    Icone: Mail,
    corpo: (
      <p>
        O canal de contato do encarregado pelo tratamento de dados (LGPD) ainda está sendo definido e será publicado
        aqui. Enquanto isso, tudo o que a lei garante a você já pode ser feito pelo Perfil.
      </p>
    ),
  },
]

export function PoliticaPrivacidade({ hrefInicio, hrefLogin }: PoliticaPrivacidadeProps) {
  const voltar = (
    <Link
      href={hrefInicio}
      className="text-corpo-forte text-primary inline-flex min-h-11 items-center gap-1 self-start"
    >
      <ArrowLeft className="size-5" aria-hidden="true" />
      Voltar para o início
    </Link>
  )
  return (
    <div className="max-w-conteudo mx-auto w-full px-5 py-6 md:px-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-12 lg:pb-18">
      <nav aria-label="Nesta página" className="hidden flex-col gap-2 lg:sticky lg:top-6 lg:flex">
        {voltar}
        <p className="text-rotulo-secao text-muted-foreground px-3 pt-3 uppercase">Nesta página</p>
        <ul className="flex flex-col">
          {SECOES.map((secao) => (
            <li key={secao.id}>
              <a
                href={`#${secao.id}`}
                className="rounded-campo text-muted-foreground hover:bg-secondary hover:text-foreground flex min-h-11 items-center px-3 font-semibold"
              >
                {secao.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <article className="lg:bg-card lg:border-border lg:rounded-grande lg:shadow-card flex max-w-[820px] flex-col gap-6 lg:gap-8 lg:border lg:p-12">
        <div className="lg:hidden">{voltar}</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-titulo-1 lg:text-[32px] lg:leading-10">Política de privacidade</h1>
          <p className="text-legenda text-muted-foreground">Atualizada em 18 de novembro de 2026</p>
          <p className="text-corpo text-muted-foreground mt-2 lg:text-base lg:leading-6">
            Este texto explica, em linguagem simples, quais dados o PoupaMais guarda, por que guarda e o que você pode
            fazer com eles.
          </p>
        </div>
        {SECOES.map(({ id, titulo, Icone, corpo }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-titulo`}
            className="text-corpo flex scroll-mt-6 flex-col gap-3"
          >
            <h2 id={`${id}-titulo`} className="text-titulo-2 flex items-center gap-3">
              <FunctionIcon funcao="primaria" icone={Icone} />
              {titulo}
            </h2>
            {corpo}
          </section>
        ))}
        <p className="text-corpo text-muted-foreground">
          Já tem conta?{' '}
          <Link href={hrefLogin} className="text-corpo-forte text-primary hover:text-primaria-hover underline">
            Entre
          </Link>{' '}
          e abra o Perfil.
        </p>
      </article>
    </div>
  )
}
