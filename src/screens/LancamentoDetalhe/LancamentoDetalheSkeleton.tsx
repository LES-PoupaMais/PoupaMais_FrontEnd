import { TransactionDetailSkeleton } from '@/components/organisms/transaction-detail'

/** Fallback do <Suspense> da rota (enquanto o `params` chega) */
export function LancamentoDetalheSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[640px] md:pt-14">
      <div className="md:rounded-grande md:border-border md:bg-card md:border md:p-6">
        <TransactionDetailSkeleton />
      </div>
    </div>
  )
}
