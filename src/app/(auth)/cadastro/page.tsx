import { Card, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'

// Placeholder: o formulário real (CadastroForm + Server Action) entra no card "Autenticação com BFF".
export default function CadastroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">Criar conta</h1>
        </CardTitle>
        <CardDescription>Comece a controlar suas finanças hoje.</CardDescription>
      </CardHeader>
    </Card>
  )
}
