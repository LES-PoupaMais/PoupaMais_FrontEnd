import type { ReactNode } from 'react'
import { AuthTemplate } from '@/components/templates/auth-template'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthTemplate>{children}</AuthTemplate>
}
