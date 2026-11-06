import type { ReactNode } from 'react'
import { AppTemplate } from '@/components/templates/app-template'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppTemplate>{children}</AppTemplate>
}
