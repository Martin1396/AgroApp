import { useCallback, useEffect, useState } from 'react'

import { List, Plus } from 'lucide-react'

import { useLiveRefresh } from '../hooks/useLiveRefresh'

import { useUsdCopRate } from '../hooks/useUsdCopRate'

import { addVenta, getActiveVentas, getCierresVentas, groupVentasByComercializadora } from '../utils/sales'

import AddVentaModal from './AddVentaModal'

import VentasCatalogosModal from './VentasCatalogosModal'

import VentasComercializadoraGroup from './VentasComercializadoraGroup'

import VentasCierreMes from './VentasCierreMes'

import VentasDolarHoy from './VentasDolarHoy'

import VentasTotalesSidebar from './VentasTotalesSidebar'

import './VentasPanel.css'

import './VentasCatalogosModal.css'



export default function VentasPanel() {

  const [ventas, setVentas] = useState([])
  const [cierreEstado, setCierreEstado] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)

  const [catalogosOpen, setCatalogosOpen] = useState(false)

  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0)

  const [loadError, setLoadError] = useState('')

  const { tasaInfo, tasa, loading: tasaLoading, error: tasaError, refresh: refreshTasa } = useUsdCopRate()



  const refresh = useCallback(async ({ silent = false } = {}) => {

    if (!silent) setLoadError('')

    try {

      const [items, estado] = await Promise.all([
        getActiveVentas(),
        getCierresVentas().catch(() => null),
      ])

      setVentas(items)
      if (estado) setCierreEstado(estado)

    } catch (e) {

      if (!silent) setLoadError(e.message || 'No se pudieron cargar las ventas')

    }

  }, [])



  useLiveRefresh(refresh, !modalOpen && !catalogosOpen)



  useEffect(() => {

    refresh()

  }, [refresh])



  const handleSave = async (data) => {
    const created = await addVenta(data)
    setVentas((prev) => {
      if (prev.some((v) => v.id === created.id)) {
        return prev.map((v) => (v.id === created.id ? created : v))
      }
      return [...prev, created]
    })
    setModalOpen(false)
    refresh({ silent: true })
  }



  const handleCatalogUpdate = () => {

    setCatalogRefreshKey((n) => n + 1)

  }



  return (

    <section className="ventas-panel">

      <div className="ventas-panel__toolbar">

        <button type="button" className="ventas-panel__add-btn" onClick={() => setModalOpen(true)}>

          <Plus size={20} strokeWidth={2.5} />

          Agregar venta

        </button>

        <button

          type="button"

          className="ventas-panel__catalog-btn"

          onClick={() => setCatalogosOpen(true)}

        >

          <List size={18} />

          Comercializadoras y variedades

        </button>

      </div>



      <div className="ventas-panel__body">

        {loadError ? (

          <p className="ventas-panel__empty" role="alert">

            {loadError}. Espera unos segundos y recarga la página.

          </p>

        ) : (

          <div className="ventas-panel__layout">
            <aside className="ventas-panel__aside">
              <VentasDolarHoy
                tasaInfo={tasaInfo}
                loading={tasaLoading}
                error={tasaError}
                onRefresh={refreshTasa}
              />
              <VentasTotalesSidebar ventas={ventas} tasa={tasa} tasaInfo={tasaInfo} />
              <VentasCierreMes estado={cierreEstado} tasa={tasa} />
            </aside>

            <div className="ventas-panel__main">

              {ventas.length === 0 ? (

                <p className="ventas-panel__empty">

                  No hay ventas registradas. Pulsa &quot;Agregar venta&quot; para crear una.

                </p>

              ) : (

                <div className="ventas-grupos">
                  {groupVentasByComercializadora(ventas, tasa).map((grupo) => (
                    <VentasComercializadoraGroup
                      key={grupo.nombre}
                      grupo={grupo}
                      tasa={tasa}
                      onUpdate={refresh}
                    />
                  ))}
                </div>

              )}

            </div>
          </div>

        )}

      </div>



      {modalOpen && (

        <AddVentaModal

          onSave={handleSave}

          onCancel={() => setModalOpen(false)}

          onOpenCatalogos={() => setCatalogosOpen(true)}

          catalogRefreshKey={catalogRefreshKey}

        />

      )}



      {catalogosOpen && (

        <VentasCatalogosModal

          onClose={() => setCatalogosOpen(false)}

          onUpdate={handleCatalogUpdate}

        />

      )}

    </section>

  )

}


