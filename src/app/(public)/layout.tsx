import { PublicTemplate } from '@/components/templates/public-template'

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return <PublicTemplate>{children}</PublicTemplate>
}
