import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { dashboardService } from '@/services/dashboard.service'
import type { MesAno } from '@/types/api'

/** Dashboard do mês da URL. Ao trocar de mês, mantém o anterior na tela até o novo chegar (sem piscar). */
export function useDashboard(periodo: MesAno) {
  return useQuery({
    queryKey: queryKeys.dashboard.mes(periodo),
    queryFn: () => dashboardService.obter(periodo),
    placeholderData: keepPreviousData,
  })
}
