'use client'

import { useEffect } from 'react'
import { registrarServiceWorker } from '@/lib/service-worker'

/** Registra o service worker do PWA (só no build de produção; ver `lib/service-worker`). Não desenha nada. */
export function RegistroServiceWorker() {
  useEffect(() => {
    void registrarServiceWorker()
  }, [])
  return null
}
