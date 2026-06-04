import { X } from 'lucide-react'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Sí',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <button type="button" className="confirm-dialog__close" onClick={onCancel} aria-label="Cerrar">
          <X size={20} />
        </button>
        <h2 className="confirm-dialog__title">{title}</h2>
        {message && <p className="confirm-dialog__text">{message}</p>}
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
