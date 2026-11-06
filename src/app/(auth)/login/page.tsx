import { Card, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'

// Placeholder: o formulário real (LoginForm + Server Action) entra no card "Autenticação com BFF".
export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
        </CardTitle>
        <CardDescription>Entre na sua conta para continuar.</CardDescription>
      </CardHeader>
    </Card>
  )
}
