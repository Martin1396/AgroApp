import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIA_LABELS } from '../../utils/inventory'
import './ProductoBusquedaField.css'

function normalizeQuery(value) {
  return String(value ?? '').trim()
}

export function filterProductos(productos, query) {
  const q = normalizeQuery(query)
  if (!q) return []
  const lower = q.toLowerCase()

  return productos.filter((p) => String(p.nombre).toLowerCase().includes(lower))
}

export function resolveProducto(productos, query) {
  const q = normalizeQuery(query)
  if (!q) return null
  const lower = q.toLowerCase()

  const exactName = productos.find((p) => String(p.nombre).toLowerCase() === lower)
  if (exactName) return exactName

  const matches = filterProductos(productos, q)
  if (matches.length === 1) return matches[0]
  return null
}

export default function ProductoBusquedaField({
  id,
  productos,
  value,
  onChange,
  onProductoChange,
  attempted = false,
  hasError = false,
  placeholder = 'Nombre del producto',
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const suggestions = useMemo(() => filterProductos(productos, value).slice(0, 8), [productos, value])
  const producto = useMemo(() => resolveProducto(productos, value), [productos, value])

  useEffect(() => {
    onProductoChange?.(producto)
  }, [producto, onProductoChange])

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const pickProducto = (p) => {
    onChange(p.nombre)
    setOpen(false)
  }

  return (
    <div className="producto-busqueda" ref={wrapRef}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        className={`inventario-mov__input ${attempted && hasError ? 'inventario-mov__input--error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />

      {open && suggestions.length > 0 && normalizeQuery(value) && (
        <ul className="producto-busqueda__list" role="listbox">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button type="button" className="producto-busqueda__opt" onClick={() => pickProducto(p)}>
                <span className="producto-busqueda__nombre">{p.nombre}</span>
                <span className="producto-busqueda__cat">{CATEGORIA_LABELS[p.categoria] ?? p.categoria}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {producto && (
        <p className="producto-busqueda__match">
          Seleccionado: <strong>{producto.nombre}</strong>
        </p>
      )}
    </div>
  )
}
