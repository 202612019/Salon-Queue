import { useEffect, useId, useRef, type ReactNode } from 'react'
export function Modal({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId()
  useEffect(() => {
    const dialog = ref.current!, previous = document.activeElement as HTMLElement | null
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '')
    dialog.querySelector<HTMLElement>('input,button')?.focus()
    return () => { dialog.close?.(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="staff-modal" aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const items = Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]'))
    if (!items.length) { event.preventDefault(); return }
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus() }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus() }
  }}><h2 id={id}>{title}</h2>{children}</dialog>
}
