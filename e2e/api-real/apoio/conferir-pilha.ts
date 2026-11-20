// globalSetup: falha logo, com a instrução certa, se a pilha E2E (API + Mailpit) não estiver de pé.
import { apiNoAr, URL_API } from './api'
import { URL_MAILPIT } from './mailpit'

export default async function conferirPilha(): Promise<void> {
  const mailpit = await fetch(`${URL_MAILPIT}/api/v1/info`).then(
    (r) => r.ok,
    () => false,
  )
  if (!(await apiNoAr()) || !mailpit) {
    throw new Error(
      `Pilha E2E fora do ar (API ${URL_API}, Mailpit ${URL_MAILPIT}). ` +
        'Suba com: cd ../PoupaMais_Development && E2E_FRONT_PORT=3130 npm run e2e:up',
    )
  }
}
