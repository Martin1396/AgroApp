import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  applyCompanyTheme,
  getCompanySettings,
  loadCompanySettings,
  saveCompanySettings,
} from '../utils/company'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const [savedSettings, setSavedSettings] = useState(() => getCompanySettings())
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)

  const settings = preview ?? savedSettings

  useEffect(() => {
    loadCompanySettings()
      .then(setSavedSettings)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) applyCompanyTheme(settings)
  }, [settings, loading])

  const updateSettings = async (next) => {
    const saved = await saveCompanySettings(next)
    setSavedSettings(saved)
    setPreview(null)
  }

  const setPreviewDraft = useCallback((draft) => {
    setPreview(draft)
  }, [])

  const clearPreview = useCallback(() => {
    setPreview(null)
  }, [])

  return (
    <CompanyContext.Provider
      value={{
        settings,
        savedSettings,
        updateSettings,
        setPreviewDraft,
        clearPreview,
        isPreviewing: preview !== null,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) {
    throw new Error('useCompany debe usarse dentro de CompanyProvider')
  }
  return ctx
}
