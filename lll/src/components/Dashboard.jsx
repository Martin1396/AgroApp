import { useState, useRef, useEffect } from 'react'

import {

  ArrowLeft,

  Building2,

  ChevronDown,

  Flower2,

  Package,

  CircleDollarSign,

  ClipboardList,

  LogOut,

  User,

  UserPlus,

  CheckCircle2,

} from 'lucide-react'

import PageBackground from './PageBackground'

import ProfilePanel from './ProfilePanel'

import RegistrationForm from './RegistrationForm'

import CompanySettingsPanel from './CompanySettingsPanel'
import ProductionPanel from './ProductionPanel'
import VentasPanel from './VentasPanel'
import InventarioPanel from './InventarioPanel'
import HistorialPanel from './HistorialPanel'

import BrandName from './BrandName'

import BrandLogo from './BrandLogo'

import BrandFooter from './BrandFooter'

import BrandTagline from './BrandTagline'

import { clearSession, buildDisplayName } from '../utils/session'

import { isDeveloperRole } from '../constants/auth'

import './Dashboard.css'



const MENU = [

  { id: 'produccion', label: 'Producción', icon: Flower2, color: '#e8a0b4' },

  { id: 'inventario', label: 'Inventario', icon: Package, color: 'var(--gold)' },

  { id: 'ventas', label: 'Ventas', icon: CircleDollarSign, color: 'var(--gold)' },

  { id: 'historial', label: 'Historial', icon: ClipboardList, color: '#e8a060' },

]

const MENU_LABELS = {
  produccion: 'Producción',
  inventario: 'Inventario',
  ventas: 'Ventas',
  historial: 'Historial',
}

const PROFILE_MENU = [

  { id: 'perfil', label: 'Perfil', icon: User },

  { id: 'registrar', label: 'Registrar usuario', icon: UserPlus, adminOnly: true },

  { id: 'empresa', label: 'Configuración de la empresa', icon: Building2, developerOnly: true },

]



export default function Dashboard({ user, onLogout, onUserUpdate }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const [activeView, setActiveView] = useState('home')

  const [profileOpen, setProfileOpen] = useState(false)

  const [savedNotice, setSavedNotice] = useState(null)

  const [dataVersion, setDataVersion] = useState(0)

  const profileRef = useRef(null)

  const isDeveloper = isDeveloperRole(user?.role)
  const isAdmin = user?.role === 'administrador' || isDeveloper
  const roleLabel = isDeveloper
    ? 'Desarrollador'
    : user?.role === 'trabajador'
      ? 'Trabajador'
      : 'Administrador'
  const displayName = buildDisplayName(user)
  const profileMenuItems = PROFILE_MENU.filter((item) => {
    if (item.developerOnly) return isDeveloper
    if (item.adminOnly) return isAdmin
    return true
  })



  const headerTitle =
    activeView === 'perfil'
      ? 'Perfil'
      : activeView === 'registrar'
        ? 'Registrar usuario'
      : activeView === 'empresa'
        ? 'Configuración de la empresa'
        : activeMenu
          ? MENU_LABELS[activeMenu]
          : 'Principal'

  const handleGoPrincipal = () => {
    setActiveMenu(null)
    setActiveView('home')
    setProfileOpen(false)
  }



  useEffect(() => {

    if (!profileOpen) return



    const handleClickOutside = (e) => {

      if (profileRef.current && !profileRef.current.contains(e.target)) {

        setProfileOpen(false)

      }

    }



    const handleEscape = (e) => {

      if (e.key === 'Escape') setProfileOpen(false)

    }



    document.addEventListener('mousedown', handleClickOutside)

    document.addEventListener('keydown', handleEscape)

    return () => {

      document.removeEventListener('mousedown', handleClickOutside)

      document.removeEventListener('keydown', handleEscape)

    }

  }, [profileOpen])

  useEffect(() => {
    if (activeView === 'empresa' && !isDeveloper) {
      setActiveView('home')
    }
    if (activeView === 'registrar' && !isAdmin) {
      setActiveView('home')
    }
  }, [user?.role, activeView, isDeveloper, isAdmin])



  const handleProfileAction = (id) => {

    setProfileOpen(false)

    if (id === 'perfil') setActiveView('perfil')

    if (id === 'registrar') setActiveView('registrar')

    if (id === 'empresa') setActiveView('empresa')

    if (id === 'logout') handleLogout()

  }



  const handleBack = () => {

    if (activeView !== 'home') {

      setActiveView('home')

    }

  }



  const handleLogout = () => {

    clearSession()

    onLogout()

  }



  const handleProfileSaved = () => {

    setActiveView('home')

    setSavedNotice({

      title: 'Cambios guardados',

      text: 'Tu perfil se actualizó correctamente.',

    })

  }



  const handleCompanySaved = () => {

    setActiveView('home')

    setSavedNotice({

      title: 'Cambios guardados',

      text: 'La configuración de la empresa se aplicó en toda la aplicación.',

    })

  }

  const handleDataCleared = () => {
    setDataVersion((n) => n + 1)
    setActiveView('home')
    setSavedNotice({
      title: 'Datos eliminados',
      text: 'Producción, ventas e inventario fueron vaciados. La aplicación quedó en blanco.',
    })
  }



  return (

    <div className="dashboard-page">

      <PageBackground gradientId="goldBandDash" />



      <div className="dashboard-page__inner">

        <div className="dashboard-card">

          <aside className="dashboard-sidebar">

            <button
              type="button"
              className="dashboard-sidebar__brand"
              onClick={handleGoPrincipal}
              aria-label="Ir a Principal"
            >
              <BrandLogo variant="sidebar" className="dashboard-sidebar__logo" alt="" />
              <div>
                <BrandName
                  primaryClass="dashboard-sidebar__turpial"
                  secondaryClass="dashboard-sidebar__dorado"
                />
              </div>
            </button>



            <nav className="dashboard-nav">

              {MENU.map(({ id, label, icon: Icon, color }) => (

                <button

                  key={id}

                  type="button"

                  className={`dashboard-nav__item ${activeMenu === id ? 'dashboard-nav__item--active' : ''}`}

                  onClick={() => {
                    setActiveMenu(id)
                    setActiveView('home')
                  }}

                >

                  <Icon

                    size={20}

                    style={{ color: activeMenu === id ? 'var(--green-dark)' : color }}

                  />

                  <span>{label}</span>

                </button>

              ))}

            </nav>



          </aside>



          <main className="dashboard-main">

            <header className="dashboard-header">

              <div className="dashboard-header__left">

                <button

                  type="button"

                  className="dashboard-header__back"

                  aria-label="Volver"

                  onClick={handleBack}

                  disabled={activeView === 'home'}

                >

                  <ArrowLeft size={20} />

                </button>

                <h1 className="dashboard-header__title">{headerTitle}</h1>

              </div>

              <div className="dashboard-header__profile-wrap" ref={profileRef}>

                <button

                  type="button"

                  className={`dashboard-header__profile ${profileOpen ? 'dashboard-header__profile--open' : ''}`}

                  onClick={() => setProfileOpen((open) => !open)}

                  aria-expanded={profileOpen}

                  aria-haspopup="menu"

                >

                  <div className="dashboard-avatar dashboard-avatar--small">

                    <User size={18} />

                  </div>

                  <div className="dashboard-header__profile-text">
                    <span className="dashboard-header__profile-role">{roleLabel}</span>
                    <span className="dashboard-header__profile-name">{displayName}</span>
                  </div>

                  <ChevronDown size={16} className="dashboard-header__chevron" />

                </button>



                {profileOpen && (

                  <div className="dashboard-profile-menu" role="menu">

                    {profileMenuItems.map(({ id, label, icon: Icon }) => (

                      <button

                        key={id}

                        type="button"

                        role="menuitem"

                        className="dashboard-profile-menu__item"

                        onClick={() => handleProfileAction(id)}

                      >

                        <Icon size={18} />

                        <span>{label}</span>

                      </button>

                    ))}

                    <div className="dashboard-profile-menu__divider" role="separator" />

                    <button
                      type="button"
                      role="menuitem"
                      className="dashboard-profile-menu__item dashboard-profile-menu__item--logout"
                      onClick={() => handleProfileAction('logout')}
                    >
                      <LogOut size={18} />
                      <span>Cerrar sesión</span>
                    </button>

                  </div>

                )}

              </div>

            </header>



            {savedNotice && activeView === 'home' && (

              <div className="dashboard-saved-overlay" role="dialog" aria-modal="true">

                <div className="dashboard-saved-message">

                  <CheckCircle2 className="dashboard-saved-message__icon" size={48} />

                  <h3 className="dashboard-saved-message__title">{savedNotice.title}</h3>

                  <p className="dashboard-saved-message__text">{savedNotice.text}</p>

                  <button

                    type="button"

                    className="dashboard-saved-message__btn"

                    onClick={() => setSavedNotice(null)}

                  >

                    Aceptar

                  </button>

                </div>

              </div>

            )}



            {activeView === 'perfil' ? (

              <ProfilePanel

                user={user}

                onUserUpdate={onUserUpdate}

                onSaved={handleProfileSaved}

              />

            ) : activeView === 'registrar' ? (
              <div className="register-user-view">
                <RegistrationForm inDashboard />
              </div>
            ) : activeView === 'empresa' ? (
              <CompanySettingsPanel
                autoUnlock={isDeveloper}
                onSaved={handleCompanySaved}
                onDataCleared={handleDataCleared}
              />
            ) : activeMenu === 'produccion' ? (
              <ProductionPanel key={`produccion-${dataVersion}`} />
            ) : activeMenu === 'inventario' ? (
              <InventarioPanel key={`inventario-${dataVersion}`} />
            ) : activeMenu === 'ventas' ? (
              <VentasPanel key={`ventas-${dataVersion}`} />
            ) : activeMenu === 'historial' ? (
              <HistorialPanel key={`historial-${dataVersion}`} />
            ) : (
              <div className="dashboard-hero">
                <div className="dashboard-hero__brand">
                  <BrandLogo variant="main" className="dashboard-hero__logo" withHeroWrap />
                  <h2 className="dashboard-hero__title">
                    <BrandName
                      primaryClass="dashboard-hero__turpial"
                      secondaryClass="dashboard-hero__dorado"
                    />
                  </h2>
                  <BrandTagline className="dashboard-hero__tagline" />
                </div>
                <blockquote className="dashboard-quote">
                  &ldquo;El éxito de una cosecha, está en la dedicación y el cuidado que ponemos en
                  cada planta.&rdquo;
                </blockquote>
                <div className="dashboard-hero__illustration">
                  <BrandLogo variant="main" className="" alt="" />
                </div>
              </div>
            )}

          </main>

        </div>



        <BrandFooter className="dashboard-footer" />

      </div>

    </div>

  )

}


