import { useEffect, useId, useRef } from 'react'
import { Button } from './index'
export function ConfirmDialog({ title, description, confirm, dismiss, busy, confirmDisabled = false, onConfirm, onDismiss }: { title: string; description: string; confirm: string; dismiss: string; busy: boolean; confirmDisabled?: boolean; onConfirm: () => void; onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), id = useId()
  useEffect(() => {
    const element = dialog.current!, previous = document.activeElement as HTMLElement | null
    if (element.showModal) element.showModal(); else element.setAttribute('open', '')
    cancel.current?.focus()
    return () => { element.close?.(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} onCancel={event => { event.preventDefault(); if (!busy) onDismiss() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const buttons = Array.from(dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    if (!buttons.length) { event.preventDefault(); return }
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus() }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus() }
  }}><h2 id={`${id}-title`}>{title}</h2><p id={`${id}-body`}>{description}</p><div className="dialog-actions"><button ref={cancel} type="button" className="button button-secondary" disabled={busy} onClick={onDismiss}>{dismiss}</button><Button variant="danger" disabled={busy || confirmDisabled} onClick={onConfirm}>{confirm}</Button></div></dialog>
}
