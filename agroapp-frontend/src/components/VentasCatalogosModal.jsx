import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useSubmitLock } from '../hooks/useSubmitLock'
import {
  addComercializadora,
  addVariedadCatalogo,
  deleteComercializadora,
  deleteVariedadCatalogo,
  getComercializadoras,
  getVariedadesCatalogo,
} from '../utils/ventasCatalogos'
import './VentasCatalogosModal.css'

export default function VentasCatalogosModal({ onClose, onUpdate }) {
  const [tab, setTab] = useState('comercializadoras')
  const [comercializadoras, setComercializadoras] = useState([])
  const [variedades, setVariedades] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const load = async () => {
    const [c, v] = await Promise.all([getComercializadoras(), getVariedadesCatalogo()])
    setComercializadoras(c)
    setVariedades(v)
  }

  useEffect(() => {
    load().catch(() => setError('No se pudieron cargar los catálogos'))
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')
    const nombre = nuevoNombre.trim()
    if (!nombre) {
      setError('Ingresa un nombre')
      return
    }

    await runSubmit(async () => {
      try {
        if (tab === 'comercializadoras') {
          await addComercializadora(nombre)
        } else {
          await addVariedadCatalogo(nombre)
        }
        setNuevoNombre('')
        await load()
        onUpdate?.()
      } catch (err) {
        setError(err.message || 'No se pudo guardar')
      }
    })
  }

  const handleDelete = async (id, type) => {
    setError('')
    try {
      if (type === 'comercializadoras') await deleteComercializadora(id)
      else await deleteVariedadCatalogo(id)
      await load()
      onUpdate?.()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    }
  }

  const items = tab === 'comercializadoras' ? comercializadoras : variedades

  return (
    <div className="venta-modal-overlay" role="dialog" aria-modal="true">
      <div className="venta-modal ventas-catalogos-modal">
        <button type="button" className="venta-modal__close" onClick={onClose} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">Catálogos de ventas</h2>
        <p className="venta-modal__subtitle">
          Guarda comercializadoras y variedades para usarlas al agregar ventas.
        </p>

        <div className="ventas-catalogos-tabs">
          <button
            type="button"
            className={`ventas-catalogos-tabs__btn ${tab === 'comercializadoras' ? 'ventas-catalogos-tabs__btn--active' : ''}`}
            onClick={() => {
              setTab('comercializadoras')
              setNuevoNombre('')
              setError('')
            }}
          >
            Comercializadoras
          </button>
          <button
            type="button"
            className={`ventas-catalogos-tabs__btn ${tab === 'variedades' ? 'ventas-catalogos-tabs__btn--active' : ''}`}
            onClick={() => {
              setTab('variedades')
              setNuevoNombre('')
              setError('')
            }}
          >
            Variedades
          </button>
        </div>

        <form className="ventas-catalogos-add" onSubmit={handleAdd}>
          <input
            type="text"
            className="venta-input venta-input--plain"
            placeholder={tab === 'comercializadoras' ? 'Nueva comercializadora' : 'Nueva variedad'}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
            <Plus size={16} />
            {isSubmitting ? 'Guardando...' : 'Agregar'}
          </button>
        </form>

        {error && <p className="venta-form__error">{error}</p>}

        <ul className="ventas-catalogos-list">
          {items.length === 0 ? (
            <li className="ventas-catalogos-list__empty">No hay registros aún.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="ventas-catalogos-list__row">
                <span>{item.nombre}</span>
                <button
                  type="button"
                  className="ventas-catalogos-list__delete"
                  onClick={() => handleDelete(item.id, tab)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
