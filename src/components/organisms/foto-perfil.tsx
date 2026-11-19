'use client'

import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import { useId, type ChangeEvent } from 'react'
import { AvatarUsuario } from '@/components/atoms/avatar'
import { Button, buttonVariants } from '@/components/atoms/button'
import { MensagemErro } from '@/components/molecules/form-field'
import { FOTO_TIPOS } from '@/schemas/perfil.schema'
import { cn } from '@/lib/cn'

// Foto do Perfil (DS: Avatar 96px, `.pm-avatar-editor`; pranchetas perfil-celular e perfil-foto-celular).
// - "Trocar foto" é um <label> com <input type="file" accept> real (o anel de foco aparece no label). Sem foto: "Enviar foto".
// - "Remover foto" (perigo-texto) só aparece quando há foto.
// - Enviando: véu + spinner sobre o avatar, botão "Enviando…" desabilitado e "Enviando a foto…" anunciado.
// - Erro (tipo/tamanho, conferido pela tela antes de enviar, ou falha da API): borda do card em `erro` e a mensagem com `role="alert"`;
//   a foto atual continua.

export type FotoPerfilProps = {
  nome: string
  /** URL da foto (com a versão), ou null para a inicial */
  fotoUrl: string | null
  enviando?: boolean
  removendo?: boolean
  erro?: string | null
  /** Arquivo escolhido (a tela valida tipo e tamanho e envia) */
  onEscolherArquivo: (arquivo: File) => void
  onRemover: () => void
  /** Sem conexão: os botões que gravam ficam desabilitados, com o motivo em `idMotivo` */
  bloqueado?: boolean
  idMotivo?: string
}

export function FotoPerfil({
  nome,
  fotoUrl,
  enviando = false,
  removendo = false,
  erro,
  onEscolherArquivo,
  onRemover,
  bloqueado = false,
  idMotivo,
}: FotoPerfilProps) {
  const base = useId()
  const idAjuda = `${base}-ajuda`
  const possuiFoto = Boolean(fotoUrl)
  const ocupado = enviando || removendo
  const desabilitado = bloqueado || ocupado

  function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = '' // permite escolher o mesmo arquivo de novo depois de um erro
    if (arquivo) onEscolherArquivo(arquivo)
  }

  return (
    <section
      aria-label={enviando ? 'Foto de perfil, enviando' : 'Foto de perfil'}
      data-erro={erro ? true : undefined}
      className="rounded-card border-border bg-card text-card-foreground shadow-card data-[erro=true]:border-destructive border p-5"
    >
      <div className="flex flex-wrap items-center gap-5">
        <span className="relative inline-grid shrink-0">
          {enviando ? (
            <span
              role="img"
              aria-label="Enviando foto"
              aria-busy="true"
              className="bg-secondary relative grid size-24 place-items-center overflow-hidden rounded-full"
            >
              <AvatarUsuario nome={nome} fotoUrl={fotoUrl} tamanho={96} decorativo />
              <span className="bg-sobreposicao text-sobre-destaque-card absolute inset-0 grid place-items-center">
                <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
              </span>
            </span>
          ) : (
            <AvatarUsuario nome={nome} fotoUrl={fotoUrl} tamanho={96} />
          )}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-2">
          <p className="text-titulo-3 break-words">{nome}</p>
          <div className="flex flex-wrap gap-2">
            {enviando ? (
              <Button variant="contornado" size="pequeno" className="min-h-11" disabled>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Enviando…
              </Button>
            ) : (
              <label
                className={cn(
                  buttonVariants({ variant: 'contornado', size: 'pequeno' }),
                  'relative min-h-11 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2',
                  desabilitado && 'cursor-not-allowed opacity-45',
                )}
              >
                <Camera aria-hidden="true" />
                {possuiFoto ? 'Trocar foto' : 'Enviar foto'}
                <input
                  type="file"
                  accept={FOTO_TIPOS.join(',')}
                  className="sr-only"
                  onChange={escolher}
                  disabled={desabilitado}
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={[idAjuda, bloqueado && idMotivo].filter(Boolean).join(' ')}
                />
              </label>
            )}
            {possuiFoto && !enviando && (
              <Button
                variant="perigo-texto"
                size="pequeno"
                className="min-h-11"
                loading={removendo}
                disabled={bloqueado || enviando}
                aria-describedby={bloqueado ? idMotivo : undefined}
                onClick={onRemover}
              >
                {!removendo && <Trash2 aria-hidden="true" />}
                Remover foto
              </Button>
            )}
          </div>
          {erro ? (
            <div role="alert">
              <MensagemErro id={idAjuda}>{erro}</MensagemErro>
            </div>
          ) : enviando ? (
            <span id={idAjuda} role="status" className="text-legenda text-muted-foreground">
              Enviando a foto…
            </span>
          ) : (
            <span id={idAjuda} className="text-legenda text-muted-foreground">
              JPG, PNG ou WEBP até 2 MB.
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
