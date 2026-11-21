'use client'

import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { SegmentedControl } from '@/components/molecules/segmented-control'
import { PerfilSecao } from './perfil-secao'

// Bloco "Aparência" do Perfil: tema Sistema | Claro | Escuro (SegmentedControl em bloco). A escolha vale neste navegador
// (quem guarda é o next-themes, na tela). `tema` null = ainda não se sabe (antes da hidratação): nenhuma opção marcada.

export type TemaPreferido = 'system' | 'light' | 'dark'

export type AparenciaTemaProps = {
  tema: TemaPreferido | null
  onTemaChange: (tema: TemaPreferido) => void
}

// Abaixo de 375px (ex.: 360) os ícones saem para os três nomes caberem inteiros no card
const ICONE = 'size-4 max-[374px]:hidden'
const OPCOES = [
  { value: 'system', label: 'Sistema', icon: <Monitor className={ICONE} aria-hidden="true" /> },
  { value: 'light', label: 'Claro', icon: <Sun className={ICONE} aria-hidden="true" /> },
  { value: 'dark', label: 'Escuro', icon: <Moon className={ICONE} aria-hidden="true" /> },
] as const

export function AparenciaTema({ tema, onTemaChange }: AparenciaTemaProps) {
  return (
    <PerfilSecao titulo="Aparência" icone={Palette}>
      <div className="flex flex-col gap-2">
        <SegmentedControl label="Tema" bloco compacto options={OPCOES} value={tema} onChange={onTemaChange} />
        <p className="text-legenda text-muted-foreground">
          Sistema segue a configuração do seu aparelho. A escolha vale neste navegador.
        </p>
      </div>
    </PerfilSecao>
  )
}
