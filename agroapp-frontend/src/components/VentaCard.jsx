import { useState } from 'react'
import { Camera, ChevronDown, FileText, Flower2, Pencil, Trash2, Upload } from 'lucide-react'
import {
  attachComprobante,
  computeVariedadSubtotal,
  confirmarPagoVenta,
  deleteVenta,
  formatMonto,
  getTipoFlorLabel,
  getVariedadPrecioUnitario,
  getVentaMonto,
  MAX_FACTURA_BYTES,
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
  const [uploadOk, setUploadOk] = useState('')
  const [keyAction, setKeyAction] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [showPagoSure, setShowPagoSure] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)

  const totalTallos = item.variedades.reduce((s, v) => s + v.tallos, 0)
  const montoVenta = getVentaMonto(item)

  const facturaEsImagen = item.comprobantePago?.startsWith('data:image/')

  const handleFacturaUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadOk('')
    const esImagen = file.type.startsWith('image/')
    const esPdf = file.type === 'application/pdf'

    if (!esImagen && !esPdf) {
      setUploadError('Solo se permiten fotos (JPG, PNG) o PDF de la factura')
      return
    }
    if (file.size > MAX_FACTURA_BYTES) {
      setUploadError('El archivo es muy grande. Máximo 1.5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      await attachComprobante(item.id, reader.result, file.name)
      setUploadError('')
      setUploadOk('Factura guardada. El pago aún no está confirmado.')
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
      <li className={`venta-card ${optionsOpen ? 'venta-card--options-open' : ''}`}>
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
            <strong>{formatMonto(montoVenta, moneda)}</strong>
          </p>
          {item.productionLabel && (
            <p className="venta-card__row venta-card__row--prod">
              <span>Producción asociada:</span> <strong>{item.productionLabel}</strong>
            </p>
          )}

          <div className="venta-card__variedades">
            <h4>
              <Flower2 size={16} />
              Variedades ({totalTallos} tallos en total)
            </h4>
            <ul>
              {item.variedades.map((v, i) => {
                const pu = getVariedadPrecioUnitario(v, item)
                const subtotal = computeVariedadSubtotal(v, item)
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

        <button
          type="button"
          className="venta-card__options-toggle"
          onClick={() => setOptionsOpen((v) => !v)}
          aria-expanded={optionsOpen}
          aria-controls={`venta-card-options-${item.id}`}
        >
          <span>Opciones de venta</span>
          <ChevronDown size={20} className="venta-card__chevron" aria-hidden="true" />
        </button>

        <div
          id={`venta-card-options-${item.id}`}
          className="venta-card__options"
          hidden={!optionsOpen}
        >
        <div className="venta-card__factura">
          <div className="venta-card__factura-head">
            <Camera size={18} />
            <div>
              <p className="venta-card__factura-title">Foto de la factura (opcional)</p>
              <p className="venta-card__factura-hint">
                Sube la factura para comparar. Esto no confirma el pago.
              </p>
            </div>
          </div>

          <label className="venta-card__upload-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*,application/pdf,.pdf"
              onChange={handleFacturaUpload}
              hidden
            />
            <span className="venta-card__upload-btn">
              <Upload size={16} />
              Subir foto o PDF
            </span>
          </label>

          {item.comprobanteNombre && (
            <p className="venta-card__file-name">
              Archivo: <strong>{item.comprobanteNombre}</strong>
            </p>
          )}

          {facturaEsImagen && (
            <img
              className="venta-card__factura-preview"
              src={item.comprobantePago}
              alt={`Factura venta ${item.sequence}`}
            />
          )}

          {!facturaEsImagen && item.comprobanteNombre?.toLowerCase().endsWith('.pdf') && (
            <p className="venta-card__file-type">
              <FileText size={14} />
              PDF adjunto para revisión
            </p>
          )}

          {uploadOk && <p className="venta-card__upload-ok">{uploadOk}</p>}
          {uploadError && <p className="venta-card__upload-error">{uploadError}</p>}
        </div>

        <div className="venta-card__confirm-wrap">
          <button
            type="button"
            className="venta-card__confirm"
            onClick={() => setKeyAction(KEY_ACTION.CONFIRMAR)}
          >
            Confirmar pago
          </button>
          <p className="venta-card__confirm-hint">
            Solo al pulsar este botón la venta pasa al historial.
          </p>
        </div>

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
          message={`¿Confirmar el pago de la Venta ${item.sequence}? La venta pasará al historial. Subir la factura no confirma el pago automáticamente.`}
          confirmLabel="Sí"
          cancelLabel="No"
          onConfirm={handleConfirmPagoFinal}
          onCancel={() => setShowPagoSure(false)}
        />
      )}

      {editOpen && (
        <AddVentaModal
          key={item.id}
          venta={item}
          onSave={handleEditSave}
          onCancel={() => setEditOpen(false)}
        />
      )}
    </>
  )
}
