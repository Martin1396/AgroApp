import { useState } from 'react'
import { Copy, Layers, Plus, Trash2, X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { SpeechInputWrap } from './SpeechField'
import ComboTextoAsistente from './ComboTextoAsistente'
import '../AddVentaModal.css'
import './BitacoraFormModal.css'

function emptyProducto() {
  return { id: crypto.randomUUID?.() ?? `p-${Date.now()}`, nombre: '', proposito: '', dosis: '' }
}

function emptyRonda(index) {
  return {
    id: crypto.randomUUID?.() ?? `r-${Date.now()}-${index}`,
    nombre: `Ronda ${index}`,
    productos: [emptyProducto()],
  }
}

function cloneProducto(p) {
  return {
    id: crypto.randomUUID?.() ?? `p-${Date.now()}`,
    nombre: p.nombre ?? '',
    proposito: p.proposito ?? '',
    dosis: p.dosis ?? '',
  }
}

function duplicateRonda(source, index) {
  const baseName = source.nombre?.trim() || `Ronda ${index}`
  return {
    id: crypto.randomUUID?.() ?? `r-${Date.now()}-${index}`,
    nombre: `${baseName} (copia)`,
    productos: source.productos?.length
      ? source.productos.map(cloneProducto)
      : [emptyProducto()],
  }
}

function initialRondas(initial) {
  if (initial?.rondas?.length) {
    return initial.rondas.map((r, i) => ({
      id: r.id || (crypto.randomUUID?.() ?? `r-${i}`),
      nombre: r.nombre || `Ronda ${i + 1}`,
      productos: r.productos?.length
        ? r.productos.map((p) => ({ ...p, id: p.id || crypto.randomUUID?.() }))
        : [emptyProducto()],
    }))
  }
  if (initial?.productos?.length) {
    return [{
      id: crypto.randomUUID?.() ?? 'r-1',
      nombre: 'Ronda 1',
      productos: initial.productos.map((p) => ({ ...p, id: p.id || crypto.randomUUID?.() })),
    }]
  }
  return [emptyRonda(1)]
}

export default function ComboFormModal({ initial = null, categoriaId = null, categoriaNombre = '', onSave, onCancel }) {
  const isEdit = Boolean(initial)
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [rondas, setRondas] = useState(() => initialRondas(initial))
  const [activeRonda, setActiveRonda] = useState(0)
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const current = rondas[activeRonda] ?? rondas[0]

  const updateRondaNombre = (id, value) => {
    setRondas((prev) => prev.map((r) => (r.id === id ? { ...r, nombre: value } : r)))
  }

  const updateProducto = (rondaId, prodId, field, value) => {
    setRondas((prev) =>
      prev.map((r) =>
        r.id === rondaId
          ? {
              ...r,
              productos: r.productos.map((p) => (p.id === prodId ? { ...p, [field]: value } : p)),
            }
          : r,
      ),
    )
  }

  const addProducto = (rondaId) => {
    setRondas((prev) =>
      prev.map((r) =>
        r.id === rondaId ? { ...r, productos: [...r.productos, emptyProducto()] } : r,
      ),
    )
  }

  const removeProducto = (rondaId, prodId) => {
    setRondas((prev) =>
      prev.map((r) => {
        if (r.id !== rondaId) return r
        const next = r.productos.filter((p) => p.id !== prodId)
        return { ...r, productos: next.length ? next : [emptyProducto()] }
      }),
    )
  }

  const addRondaNueva = () => {
    const nextIndex = rondas.length + 1
    const next = emptyRonda(nextIndex)
    setRondas((prev) => [...prev, next])
    setActiveRonda(rondas.length)
  }

  const duplicateRondaActual = () => {
    const source = rondas[activeRonda] ?? rondas[rondas.length - 1]
    if (!source) return
    const nextIndex = rondas.length + 1
    const copy = duplicateRonda(source, nextIndex)
    setRondas((prev) => [...prev, copy])
    setActiveRonda(rondas.length)
  }

  const removeRonda = (index) => {
    if (rondas.length <= 1) return
    setRondas((prev) => prev.filter((_, i) => i !== index))
    setActiveRonda((prev) => (prev >= index && prev > 0 ? prev - 1 : prev))
  }

  const applyTextoParseado = (parsed) => {
    if (parsed.nombre?.trim()) setNombre(parsed.nombre.trim())
    if (parsed.descripcion?.trim()) setDescripcion(parsed.descripcion.trim())
    if (parsed.rondas?.length) {
      setRondas(
        parsed.rondas.map((r, i) => ({
          id: crypto.randomUUID?.() ?? `r-${Date.now()}-${i}`,
          nombre: r.nombre || `Ronda ${i + 1}`,
          productos: r.productos.length
            ? r.productos.map((p) => ({
                id: crypto.randomUUID?.() ?? `p-${Date.now()}`,
                nombre: p.nombre ?? '',
                proposito: p.proposito ?? '',
                dosis: p.dosis ?? '',
              }))
            : [emptyProducto()],
        })),
      )
      setActiveRonda(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    if (!nombre.trim()) {
      setError('Ingresa el nombre del combo')
      return
    }

    const payloadRondas = rondas
      .map((r, i) => ({
        nombre: (r.nombre.trim() || `Ronda ${i + 1}`),
        productos: r.productos
          .map((p) => ({
            nombre: p.nombre.trim(),
            proposito: p.proposito.trim(),
            dosis: p.dosis.trim(),
          }))
          .filter((p) => p.nombre),
      }))
      .filter((r) => r.productos.length > 0)

    if (!payloadRondas.length) {
      setError('Agrega al menos una ronda con productos')
      return
    }

    await runSubmit(async () => {
      await onSave?.({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaId: initial?.categoriaId ?? categoriaId,
        rondas: payloadRondas,
      })
    })
  }

  return (
    <div className="venta-modal-overlay" role="dialog" aria-modal="true">
      <div className="venta-modal bitacora-combo-modal">
        <button type="button" className="venta-modal__close" onClick={onCancel} disabled={isSubmitting} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">{isEdit ? 'Editar combo' : 'Nuevo combo'}</h2>
        <p className="venta-modal__subtitle">
          {categoriaNombre
            ? <>Categoría: <strong>{categoriaNombre}</strong>. Escribe o dicta con el micrófono en cada campo.</>
            : 'Escribe o dicta con el micrófono en cada campo.'}
        </p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <ComboTextoAsistente onApply={applyTextoParseado} />

          <div className="venta-form__group">
            <label htmlFor="combo-nombre">Nombre del programa</label>
            <SpeechInputWrap value={nombre} onSpeech={setNombre}>
              <input
                id="combo-nombre"
                type="text"
                className="venta-input venta-input--plain"
                placeholder="Ej. Riego invernadero, Fumigación ciclo A"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </SpeechInputWrap>
          </div>

          <div className="venta-form__group">
            <label htmlFor="combo-desc">Descripción (opcional)</label>
            <SpeechInputWrap value={descripcion} onSpeech={setDescripcion}>
              <textarea
                id="combo-desc"
                className="bitacora-form__textarea"
                rows={2}
                placeholder="Notas generales del programa"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </SpeechInputWrap>
          </div>

          <fieldset className="bitacora-form__fieldset">
            <legend>Rondas del combo (rotación semanal)</legend>

            <div className="bitacora-rondas-tabs">
              {rondas.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={`bitacora-ronda-tab ${activeRonda === i ? 'bitacora-ronda-tab--active' : ''}`}
                  onClick={() => setActiveRonda(i)}
                >
                  <Layers size={14} />
                  {r.nombre.trim() || `Ronda ${i + 1}`}
                </button>
              ))}
            </div>

            <div className="bitacora-rondas-add">
              <button type="button" className="bitacora-rondas-add__btn" onClick={addRondaNueva}>
                <Plus size={15} />
                Nueva ronda
              </button>
              <button
                type="button"
                className="bitacora-rondas-add__btn bitacora-rondas-add__btn--dup"
                onClick={duplicateRondaActual}
                disabled={!rondas.length}
                title="Copia la ronda que estás viendo con los mismos productos"
              >
                <Copy size={15} />
                Duplicar ronda
              </button>
            </div>

            {current && (
              <div className="bitacora-ronda-panel">
                <div className="bitacora-ronda-panel__head">
                  <SpeechInputWrap
                    value={current.nombre}
                    onSpeech={(v) => updateRondaNombre(current.id, v)}
                    className="bitacora-ronda-panel__name-wrap"
                  >
                    <input
                      type="text"
                      className="venta-input venta-input--plain bitacora-ronda-panel__name"
                      placeholder={`Nombre ronda ${activeRonda + 1} (ej. Semana ${activeRonda + 1})`}
                      value={current.nombre}
                      onChange={(e) => updateRondaNombre(current.id, e.target.value)}
                    />
                  </SpeechInputWrap>
                  <button
                    type="button"
                    className="bitacora-ronda-panel__dup"
                    onClick={duplicateRondaActual}
                    title="Duplicar esta ronda con los mismos productos"
                  >
                    <Copy size={14} />
                    Duplicar
                  </button>
                  {rondas.length > 1 && (
                    <button
                      type="button"
                      className="bitacora-ronda-panel__remove"
                      onClick={() => removeRonda(activeRonda)}
                    >
                      <Trash2 size={14} />
                      Quitar ronda
                    </button>
                  )}
                </div>

                <p className="bitacora-ronda-panel__hint">
                  Cada semana en el día del cronograma rota automáticamente a la siguiente ronda (1, 2, 3… y vuelve a 1).
                </p>

                {current.productos.map((p, i) => (
                  <div key={p.id} className="bitacora-combo-producto">
                    <span className="bitacora-combo-producto__num">{i + 1}.</span>
                    <div className="bitacora-combo-producto__fields">
                      <SpeechInputWrap
                        value={p.nombre}
                        onSpeech={(v) => updateProducto(current.id, p.id, 'nombre', v)}
                      >
                        <input
                          type="text"
                          className="venta-input venta-input--plain"
                          placeholder="Producto"
                          value={p.nombre}
                          onChange={(e) => updateProducto(current.id, p.id, 'nombre', e.target.value)}
                        />
                      </SpeechInputWrap>
                      <SpeechInputWrap
                        value={p.proposito}
                        onSpeech={(v) => updateProducto(current.id, p.id, 'proposito', v)}
                      >
                        <input
                          type="text"
                          className="venta-input venta-input--plain"
                          placeholder="Para qué es (propósito)"
                          value={p.proposito}
                          onChange={(e) => updateProducto(current.id, p.id, 'proposito', e.target.value)}
                        />
                      </SpeechInputWrap>
                      <SpeechInputWrap
                        value={p.dosis}
                        onSpeech={(v) => updateProducto(current.id, p.id, 'dosis', v)}
                      >
                        <input
                          type="text"
                          className="venta-input venta-input--plain"
                          placeholder="Dosis (opcional)"
                          value={p.dosis}
                          onChange={(e) => updateProducto(current.id, p.id, 'dosis', e.target.value)}
                        />
                      </SpeechInputWrap>
                    </div>
                    {current.productos.length > 1 && (
                      <button
                        type="button"
                        className="bitacora-combo-producto__remove"
                        onClick={() => removeProducto(current.id, p.id)}
                        aria-label="Quitar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="bitacora-form__add-product"
                  onClick={() => addProducto(current.id)}
                >
                  <Plus size={16} />
                  Agregar producto
                </button>
              </div>
            )}
          </fieldset>

          {error && <p className="venta-form__error">{error}</p>}

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar combo' : 'Crear combo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
