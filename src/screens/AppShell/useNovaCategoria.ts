import { useState } from 'react'
import { toast } from 'sonner'
import { useSalvarCategoria } from '@/hooks/use-categorias'
import { erroDoNomeDaCategoria } from '@/lib/erro-categoria'
import { traduzirErro } from '@/lib/http'

// "Nova categoria" da folha Criar (celular): abre o categoria-dialog ali mesmo, sem trocar de tela (DS: CreateSheet).
export function useNovaCategoria() {
  const [aberto, setAberto] = useState(false)
  const [erroNome, setErroNome] = useState<string | null>(null)
  const salvarCategoria = useSalvarCategoria()

  const salvar = (descricao: string) => {
    setErroNome(null)
    salvarCategoria.mutate(
      { descricao },
      {
        onSuccess: () => {
          setAberto(false)
          toast.success('Categoria criada')
        },
        onError: (erro) => {
          const doCampo = erroDoNomeDaCategoria(erro)
          if (doCampo) setErroNome(doCampo)
          else toast.error(traduzirErro(erro).mensagem)
        },
      },
    )
  }

  return {
    aberto,
    abrir: () => {
      setErroNome(null)
      setAberto(true)
    },
    setAberto,
    salvar,
    salvando: salvarCategoria.isPending,
    erroNome,
  }
}
