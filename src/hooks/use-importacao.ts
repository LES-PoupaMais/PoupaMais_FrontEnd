import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidarApos } from '@/lib/invalidacoes'
import { lancamentosService } from '@/services/lancamentos.service'

// Importação de CSV (RN007/RN012). A checagem de 2 MB é feita antes, na tela (UploadArea);
// aqui só o envio. Toasts e o resultado na tela ficam no Context.

/** `POST /lancamentos/importar` (multipart, campo `arquivo`). Invalida lista, dashboard e categorias (pode criar categorias). */
export function useImportarCsv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (arquivo: File) => lancamentosService.importar(arquivo),
    onSuccess: () => invalidarApos(queryClient, 'importacao'),
  })
}
