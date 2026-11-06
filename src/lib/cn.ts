// Junta classes condicionais e resolve conflitos do Tailwind (a última vence).
// Implementação: pacote oficial do shadcn (`cn`), substituto de clsx + tailwind-merge.
// Os átomos gerados pela CLI do shadcn importam `cn` direto do pacote; padronizamos o import por aqui (@/lib/cn).
export { cn } from 'cn'
