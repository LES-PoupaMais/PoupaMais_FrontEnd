// Salva no computador um arquivo baixado da API (exportar, modelo CSV): cria um link temporário para o blob e clica nele.
export function salvarArquivo(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoga depois: alguns navegadores ainda leem a URL logo após o clique
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
