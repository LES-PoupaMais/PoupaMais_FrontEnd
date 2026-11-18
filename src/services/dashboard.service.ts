import { http } from '@/lib/http'
import type { Dashboard, MesAno } from '@/types/api'

// Dashboard do mês: só lançamentos ATIVOS (RN003). Gráficos, top 5 e peso das maiores já vêm prontos (RN008).
export const dashboardService = {
  obter: ({ mes, ano }: MesAno) => http.get<Dashboard>('/dashboard', { params: { mes, ano } }),
}
