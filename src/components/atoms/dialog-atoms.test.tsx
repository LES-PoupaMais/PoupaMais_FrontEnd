import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

// Diálogo, diálogo de alerta e folha com o visual do Design System e textos em português.

describe('Dialog', () => {
  it('fecha pelo × "Fechar" e pelo Cancelar do rodapé', async () => {
    render(
      <Dialog>
        <DialogTrigger>Exportar</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar lançamentos</DialogTitle>
            <DialogDescription>Escolha o formato.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(screen.getByRole('dialog', { name: 'Exportar lançamentos' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('AlertDialog', () => {
  it('Cancelar (contornado) e a ação (primário por padrão)', async () => {
    const aoConfirmar = vi.fn()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Sair</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>O que você preencheu será perdido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction variant="perigo" onClick={aoConfirmar}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(screen.getByRole('alertdialog', { name: 'Descartar alterações?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar editando' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Continuar editando' })).toHaveAttribute('data-variant', 'contornado')
    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(aoConfirmar).toHaveBeenCalledOnce()
  })
})

describe('Drawer (folha de baixo)', () => {
  it('abre com título, fecha pelo botão e pelo Esc', async () => {
    render(
      <Drawer>
        <DrawerTrigger>Filtros</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
            <DrawerDescription>Escolha o que mostrar.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Aplicar</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toHaveAccessibleDescription('Escolha o que mostrar.')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
