import { useState } from 'react'
import { BedDouble, Calendar, Flower2, MoreHorizontal, Trash2, XCircle } from 'lucide-react'
import { useSubmitLock } from '../hooks/useSubmitLock'
import {
  addCorte,
  deleteProduction,
  finalizarProduccion,
  getTotalCortes,
  getTotalTallosDesechados,
  updateCorte,
} from '../utils/productions'
import EditCorteModal from './EditCorteModal'
import SpecialKeyModal from './SpecialKeyModal'
import './ProductionCard.css'

function formatFechaCorte(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function parseNumeroInput(valor, minimo = 0) {
  const limpio = String(valor ?? '').replace(/\D/g, '')
  if (!limpio) return minimo === 0 ? 0 : null
  const n = Number(limpio)
  if (Number.isNaN(n) || n < minimo) return minimo === 0 ? 0 : null
  return n
}

export default function ProductionCard({ item, onUpdate }) {
  const [cantidad, setCantidad] = useState('')
  const [tallosDesechados, setTallosDesechados] = useState('')
  const [pendingCorte, setPendingCorte] = useState(null)
  const [error, setError] = useState('')
  const [keyAction, setKeyAction] = useState(null)
  const [editingCorte, setEditingCorte] = useState(null)
  const { isSubmitting: isAddingCorte, runSubmit: runAddCorte } = useSubmitLock()

  const totalFlores = getTotalCortes(item.cortes)
  const totalDesechados = getTotalTallosDesechados(item.cortes)
  const cortesOrdenados = [...item.cortes].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  )

  const handlePrepararCorte = (e) => {
    e?.preventDefault()
    if (isAddingCorte) return
    const qty = parseNumeroInput(cantidad, 1)
    if (qty == null) {
      setError('Ingresa la cantidad de flores')
      return
    }
    const desechados = parseNumeroInput(tallosDesechados, 0)
    setPendingCorte({ cantidad: qty, tallosDesechados: desechados })
    setCantidad('')
    setTallosDesechados('')
    setError('')
  }

  const handleCancelarCorte = () => {
    setPendingCorte(null)
    setError('')
  }

  const handleConfirmarCorte = async () => {
    if (isAddingCorte || pendingCorte == null) return
    await runAddCorte(async () => {
      await addCorte(item.id, pendingCorte.cantidad, pendingCorte.tallosDesechados)
      setPendingCorte(null)
      setError('')
      onUpdate?.()
    })
  }

  const confirmFinalizar = async () => {
    await finalizarProduccion(item.id)
    setKeyAction(null)
    onUpdate?.()
  }

  const confirmEliminar = async () => {
    await deleteProduction(item.id)
    setKeyAction(null)
    onUpdate?.()
  }

  return (
    <>
      <li className="production-card">
        <div className="production-card__header">
          <h3 className="production-card__title">Producción {item.code}</h3>
          <button type="button" className="production-card__menu" aria-label="Opciones">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="production-card__meta">
          <p className="production-card__meta-item">
            <BedDouble size={16} />
            <span>
              Camas: <strong>{item.desdeCama}</strong> a <strong>{item.hastaCama}</strong>
            </span>
          </p>
          <p className="production-card__meta-item production-card__meta-item--total">
            <Flower2 size={16} className="production-card__flower-icon" />
            <span>Flores útiles:</span>
            <span className="production-card__badge production-card__badge--util">{totalFlores.toLocaleString('es')}</span>
          </p>
          <p className="production-card__meta-item production-card__meta-item--total">
            <XCircle size={16} className="production-card__discard-icon" />
            <span>Tallos desechados:</span>
            <span className="production-card__badge production-card__badge--discard">{totalDesechados.toLocaleString('es')}</span>
          </p>
        </div>

        {cortesOrdenados.length > 0 && (
          <ul className="production-card__cortes">
            {cortesOrdenados.map((corte) => (
              <li key={corte.id} className="production-corte-row">
                <div className="production-corte-row__info">
                  <Calendar size={15} />
                  <span className="production-corte-row__fecha">{formatFechaCorte(corte.fecha)}</span>
                  <span className="production-corte-row__qty">{corte.cantidad}</span>
                  <span className="production-corte-row__label">flores</span>
                  {(corte.tallosDesechados ?? 0) > 0 && (
                    <>
                      <span className="production-corte-row__sep">·</span>
                      <span className="production-corte-row__qty production-corte-row__qty--discard">
                        {corte.tallosDesechados}
                      </span>
                      <span className="production-corte-row__label">desechados</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="production-corte-row__edit"
                  onClick={() => setEditingCorte(corte)}
                >
                  Modificar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="production-card__add-section">
          <p className="production-card__add-label">Agregar corte</p>

          {pendingCorte != null ? (
            <div className="production-card__pending">
              <p className="production-card__pending-text">
                Corte pendiente: <strong>{pendingCorte.cantidad.toLocaleString('es')}</strong> flores
                {pendingCorte.tallosDesechados > 0 && (
                  <>
                    {' · '}
                    <strong>{pendingCorte.tallosDesechados.toLocaleString('es')}</strong> tallos desechados
                  </>
                )}
              </p>
              <div className="production-card__pending-actions">
                <button
                  type="button"
                  className="production-card__pending-cancel"
                  onClick={handleCancelarCorte}
                  disabled={isAddingCorte}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="production-card__confirm-corte"
                  onClick={handleConfirmarCorte}
                  disabled={isAddingCorte}
                >
                  {isAddingCorte ? 'Guardando…' : 'Confirmar corte'}
                </button>
              </div>
            </div>
          ) : (
            <form className="production-card__add-row" onSubmit={handlePrepararCorte}>
              <div className="production-card__add-fields">
                <input
                  id={`corte-input-${item.id}`}
                  type="text"
                  inputMode="numeric"
                  className={`production-card__input ${error ? 'production-card__input--error' : ''}`}
                  placeholder="Flores útiles cortadas"
                  value={cantidad}
                  disabled={isAddingCorte}
                  onChange={(e) => {
                    setCantidad(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                />
                <input
                  id={`desecho-input-${item.id}`}
                  type="text"
                  inputMode="numeric"
                  className="production-card__input production-card__input--secondary"
                  placeholder="Tallos desechados (opcional)"
                  value={tallosDesechados}
                  disabled={isAddingCorte}
                  onChange={(e) => setTallosDesechados(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                className="production-card__add-submit"
                disabled={isAddingCorte || !cantidad.trim()}
              >
                Agregar corte
              </button>
              {error && <p className="production-card__input-error">{error}</p>}
            </form>
          )}
        </div>

        <button
          type="button"
          className="production-card__finish"
          onClick={() => setKeyAction('finalizar')}
        >
          <Trash2 size={18} />
          Finalizar Producción
        </button>

        <button
          type="button"
          className="production-card__delete"
          onClick={() => setKeyAction('eliminar')}
        >
          Eliminar producción
        </button>
      </li>

      {keyAction === 'finalizar' && (
        <SpecialKeyModal
          title="Finalizar producción"
          message={`Ingresa la clave especial para finalizar la producción ${item.code}. Se moverá al historial.`}
          confirmLabel="Finalizar"
          onConfirm={confirmFinalizar}
          onCancel={() => setKeyAction(null)}
        />
      )}

      {keyAction === 'eliminar' && (
        <SpecialKeyModal
          title="Eliminar producción"
          message={`Ingresa la clave especial para eliminar la producción ${item.code}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={confirmEliminar}
          onCancel={() => setKeyAction(null)}
        />
      )}

      {editingCorte && (
        <EditCorteModal
          corte={editingCorte}
          onSave={async (data) => {
            await updateCorte(item.id, editingCorte.id, data)
            setEditingCorte(null)
            onUpdate?.()
          }}
          onCancel={() => setEditingCorte(null)}
        />
      )}
    </>
  )
}
