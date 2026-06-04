import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  applyCompanyTheme,
  getCompanySettings,
  saveCompanySettings,
} from '../utils/company'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const [savedSettings, setSavedSettings] = useState(() => getCompanySettings())
  const [preview, setPreview] = useState(null)

  const settings = preview ?? savedSettings

  useEffect(() => {
    applyCompanyTheme(settings)
  }, [settings])

  const updateSettings = (next) => {
    saveCompanySettings(next)
    setSavedSettings(next)
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
