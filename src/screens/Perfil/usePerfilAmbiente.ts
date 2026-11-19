import { useSyncExternalStore } from 'react'

// Ajudas do ambiente do navegador usadas só pelo Perfil (se outra tela precisar, viram hook global/lib).

const nada = () => () => {}

/** `true` só no navegador, depois da hidratação (o tema escolhido só existe no cliente). */
export function useMontado(): boolean {
  return useSyncExternalStore(
    nada,
    () => true,
    () => false,
  )
}

/** Salva um arquivo baixado (blob) com o nome dado, pelo download do navegador. */
export function salvarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  // dá tempo de o navegador começar o download antes de liberar a URL
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
