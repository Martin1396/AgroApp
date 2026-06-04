import { useState } from 'react'
import { FileText, Flower2, Pencil, Trash2, Upload } from 'lucide-react'
import {
  attachComprobante,
  computeVariedadSubtotal,
  confirmarPagoVenta,
  deleteVenta,
  formatMonto,
  getTipoFlorLabel,
  MAX_PDF_BYTES,
  MONEDA,
  updateVenta,
} from '../utils/sales'
import AddVentaModal from './AddVentaModal'
import ConfirmDialog from './ConfirmDialog'
import SpecialKeyModal from './SpecialKeyModal'
import './VentaCard.css'

const KEY_ACTION = {
  CONFIRMAR: 'confirmar',
  MODIFICAR: 'modificar',
  ELIMINAR: 'eliminar',
}

export default function VentaCard({ item, onUpdate }) {
  const moneda = item.moneda ?? MONEDA.COP
  const [uploadError, setUploadError] = useState('')
  const [keyAction, setKeyAction] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [showPagoSure, setShowPagoSure] = useState(false)

  const totalTallos = item.variedades.reduce((s, v) => s + v.tallos, 0)

  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('Solo se permiten archivos PDF')
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      setUploadError('El PDF es muy grande. Máximo 1.5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      await attachComprobante(item.id, reader.result, file.name)
      setUploadError('')
      onUpdate?.()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleKeyConfirm = async () => {
    if (keyAction === KEY_ACTION.CONFIRMAR) {
      setKeyAction(null)
      setShowPagoSure(true)
      return
    }
    if (keyAction === KEY_ACTION.MODIFICAR) {
      setKeyAction(null)
      setEditOpen(true)
      return
    }
    if (keyAction === KEY_ACTION.ELIMINAR) {
      await deleteVenta(item.id)
      setKeyAction(null)
      onUpdate?.()
    }
  }

  const handleConfirmPagoFinal = async () => {
    await confirmarPagoVenta(item.id)
    setShowPagoSure(false)
    onUpdate?.()
  }

  const handleEditSave = async (data) => {
    await updateVenta(item.id, data)
    setEditOpen(false)
    onUpdate?.()
  }

  const keyModalConfig = {
    [KEY_ACTION.CONFIRMAR]: {
      title: 'Confirmar pago',
      message: `Ingresa la clave especial para confirmar el pago de la Venta ${item.sequence}.`,
      confirmLabel: 'Confirmar pago',
    },
    [KEY_ACTION.MODIFICAR]: {
      title: 'Modificar venta',
      message: `Ingresa la clave especial para modificar la Venta ${item.sequence}.`,
      confirmLabel: 'Continuar',
    },
    [KEY_ACTION.ELIMINAR]: {
      title: 'Eliminar venta',
      message: `Ingresa la clave especial para eliminar la Venta ${item.sequence}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar venta',
    },
  }

  const activeKeyModal = keyAction ? keyModalConfig[keyAction] : null

  return (
    <>
      <li className="venta-card">
        <div className="venta-card__header">
          <h3 className="venta-card__title">Venta {item.sequence}</h3>
        </div>

        <div className="venta-card__body">
          <p className="venta-card__row">
            <span>Cliente:</span> <strong>{item.cliente}</strong>
          </p>
          {item.tipoFlor && (
            <p className="venta-card__row">
              <span>Tipo de flor:</span>{' '}
              <strong>{getTipoFlorLabel(item.tipoFlor)}</strong>
            </p>
          )}
          <p className="venta-card__row">
            <span>Precio de venta:</span>{' '}
            <strong>{formatMonto(item.precioVenta, moneda)}</strong>
          </p>
          <p className="venta-card__row venta-card__row--prod">
            <span>Producción asociada:</span> <strong>{item.productionLabel}</strong>
          </p>

          <div className="venta-card__variedades">
            <h4>
              <Flower2 size={16} />
              Variedades ({totalTallos} tallos en total)
            </h4>
            <ul>
              {item.variedades.map((v, i) => {
                const subtotal = computeVariedadSubtotal(v)
                const pu = Number(v.precioPorUnidad) || 0
                return (
                  <li key={v.id}>
                    {i + 1}. {v.nombre} — <strong>{v.tallos}</strong> tallos
                    {pu > 0 && (
                      <>
                        {' '}
                        × {formatMonto(pu, moneda)}/u ={' '}
                        <strong>{formatMonto(subtotal, moneda)}</strong>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="venta-card__comprobante">
          <label className="venta-card__upload-label">
            <FileText size={18} />
            Comprobante de pago (PDF, opcional)
            <input type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} hidden />
            <span className="venta-card__upload-btn">
              <Upload size={16} />
              Subir archivo
            </span>
          </label>
          {item.comprobanteNombre && (
            <p className="venta-card__file-name">
              Archivo: <strong>{item.comprobanteNombre}</strong>
            </p>
          )}
          {uploadError && <p className="venta-card__upload-error">{uploadError}</p>}
        </div>

        <button
          type="button"
          className="venta-card__confirm"
          onClick={() => setKeyAction(KEY_ACTION.CONFIRMAR)}
        >
          Confirmar pago
        </button>

        <div className="venta-card__actions">
          <button
            type="button"
            className="venta-card__action venta-card__action--edit"
            onClick={() => setKeyAction(KEY_ACTION.MODIFICAR)}
          >
            <Pencil size={16} />
            Modificar venta
          </button>
          <button
            type="button"
            className="venta-card__action venta-card__action--delete"
            onClick={() => setKeyAction(KEY_ACTION.ELIMINAR)}
          >
            <Trash2 size={16} />
            Eliminar venta
          </button>
        </div>
      </li>

      {activeKeyModal && (
        <SpecialKeyModal
          title={activeKeyModal.title}
          message={activeKeyModal.message}
          confirmLabel={activeKeyModal.confirmLabel}
          onConfirm={handleKeyConfirm}
          onCancel={() => setKeyAction(null)}
        />
      )}

      {showPagoSure && (
        <ConfirmDialog
          title="Confirmar pago"
          message={`¿Está seguro que desea confirmar el pago de la Venta ${item.sequence}? La venta pasará al historial.`}
          confirmLabel="Sí"
          cancelLabel="No"
          onConfirm={handleConfirmPagoFinal}
          onCancel={() => setShowPagoSure(false)}
        />
      )}

      {editOpen && (
        <AddVentaModal
          venta={item}
          onSave={handleEditSave}
          onCancel={() => setEditOpen(false)}
        />
      )}
    </>
  )
}
