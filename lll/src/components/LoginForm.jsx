import { useState, useEffect } from 'react'
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  LockKeyhole,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import BrandLogo from './BrandLogo'
import { saveSession } from '../utils/session'
import { findUser, findUserByCedula, updateUserPassword } from '../utils/users'
import { CLAVE_ESPECIAL_ADMIN, isDeveloperCedula } from '../constants/auth'

const STORAGE_REMEMBER = 'turpial_recordar_sesion'
const STORAGE_CEDULA = 'turpial_cedula'

const FORGOT_FIELDS = ['cedula', 'newPassword', 'confirmPassword', 'codigo']

export default function LoginForm({ onSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotAttempted, setForgotAttempted] = useState(false)
  const [forgotErrors, setForgotErrors] = useState({})
  const [form, setForm] = useState({ cedula: '', password: '' })
  const [forgotForm, setForgotForm] = useState({
    cedula: '',
    newPassword: '',
    confirmPassword: '',
    codigo: '',
  })

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_REMEMBER) === 'true'
    const cedula = localStorage.getItem(STORAGE_CEDULA) || localStorage.getItem('turpial_usuario') || ''
    if (guardado && cedula) {
      setRemember(true)
      setForm((prev) => ({ ...prev, cedula }))
    }
  }, [])

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleForgotChange = (e) => {
    const { name, value } = e.target
    const updated = { ...forgotForm, [name]: value }
    setForgotForm(updated)
    setForgotSuccess(false)
    if (forgotAttempted) {
      setForgotErrors(getForgotErrors(updated))
    }
  }

  const getForgotErrors = (data) => {
    const next = {}
    FORGOT_FIELDS.forEach((field) => {
      if (!data[field].trim()) {
        next[field] = 'Dato obligatorio'
      }
    })
    if (!next.confirmPassword && data.newPassword.trim() && data.confirmPassword.trim()) {
      if (data.newPassword !== data.confirmPassword) {
        next.confirmPassword = 'Las contraseñas no coinciden'
      }
    }
    if (!next.codigo && data.codigo.trim() && data.codigo.trim() !== CLAVE_ESPECIAL_ADMIN) {
      next.codigo = 'Clave especial incorrecta'
    }
    return next
  }

  const openForgot = (e) => {
    e.preventDefault()
    setShowForgot(true)
    setForgotSuccess(false)
    setForgotAttempted(false)
    setForgotErrors({})
    setError('')
    setForgotForm({
      cedula: form.cedula,
      newPassword: '',
      confirmPassword: '',
      codigo: '',
    })
  }

  const closeForgot = (e) => {
    e?.preventDefault()
    setShowForgot(false)
    setForgotSuccess(false)
    setForgotAttempted(false)
    setForgotErrors({})
    setForgotForm({ cedula: '', newPassword: '', confirmPassword: '', codigo: '' })
  }

  const handleForgotSubmit = (e) => {
    e.preventDefault()
    setForgotAttempted(true)
    const validationErrors = getForgotErrors(forgotForm)
    setForgotErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    const cedula = forgotForm.cedula.trim()
    if (isDeveloperCedula(cedula)) {
      setForgotErrors({ cedula: 'La cuenta de desarrollador no se recupera desde aquí' })
      return
    }
    if (!findUserByCedula(cedula)) {
      setForgotErrors({ cedula: 'No existe una cuenta con esta cédula' })
      return
    }

    updateUserPassword(cedula, forgotForm.newPassword)
    setForgotSuccess(true)
    setForm((prev) => ({ ...prev, cedula, password: '' }))
  }

  const handleRememberChange = (checked) => {
    setRemember(checked)
    if (!checked) {
      localStorage.removeItem(STORAGE_REMEMBER)
      localStorage.removeItem(STORAGE_CEDULA)
      localStorage.removeItem('turpial_usuario')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.cedula.trim() || !form.password.trim()) {
      setError('Ingresa tu cédula y contraseña.')
      return
    }

    const user = findUser(form.cedula.trim(), form.password)
    if (!user) {
      setError('Cédula o contraseña incorrectos.')
      return
    }

    if (remember) {
      localStorage.setItem(STORAGE_REMEMBER, 'true')
      localStorage.setItem(STORAGE_CEDULA, form.cedula.trim())
    } else {
      localStorage.removeItem(STORAGE_REMEMBER)
      localStorage.removeItem(STORAGE_CEDULA)
      localStorage.removeItem('turpial_usuario')
    }

    const session = {
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      role: user.role,
    }
    saveSession(session)
    onSuccess?.(session)
  }

  const forgotInputClass = (field) =>
    forgotAttempted && forgotErrors[field]
      ? 'input-wrapper input-wrapper--dark input-wrapper--error-dark'
      : 'input-wrapper input-wrapper--dark'

  return (
    <section className="login-panel">
      <div className="panel-header panel-header--light">
        <div className="panel-header__icon panel-header__icon--gold">
          <LockKeyhole size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="panel-header__title">Iniciar sesión</h2>
          <p className="panel-header__subtitle">
            Ingresa tus credenciales para acceder al sistema.
          </p>
        </div>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-cedula">Cédula</label>
          <div className="input-wrapper input-wrapper--dark">
            <User className="input-icon" size={18} />
            <input
              id="login-cedula"
              name="cedula"
              type="text"
              inputMode="numeric"
              placeholder="Ingresa tu cédula"
              value={form.cedula}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Contraseña</label>
          <div className="input-wrapper input-wrapper--dark">
            <Lock className="input-icon" size={18} />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password toggle-password--light"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="login-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => handleRememberChange(e.target.checked)}
            />
            <span className="checkbox-custom" />
            Recordar sesión
          </label>
          <a
            href="#"
            className="forgot-link"
            onClick={showForgot ? closeForgot : openForgot}
          >
            {showForgot ? 'Ocultar recuperación' : '¿Olvidaste tu contraseña?'}
          </a>
        </div>

        {showForgot && (
          <div className="forgot-panel">
            <h3 className="forgot-panel__title">Recuperar contraseña</h3>
            <p className="forgot-panel__subtitle">
              Ingresa tu cédula, la nueva contraseña y la clave especial de administrador.
            </p>

            {forgotSuccess ? (
              <div className="forgot-panel__success">
                <CheckCircle2 size={32} />
                <p>Contraseña actualizada. Ya puedes iniciar sesión.</p>
                <button type="button" className="btn btn--gold forgot-panel__btn" onClick={closeForgot}>
                  Iniciar sesión
                </button>
              </div>
            ) : (
              <div className="forgot-panel__fields">
                <div className="form-group">
                  <label htmlFor="forgot-cedula">Cédula</label>
                  <div className={forgotInputClass('cedula')}>
                    <User className="input-icon" size={18} />
                    <input
                      id="forgot-cedula"
                      name="cedula"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ingresa tu cédula"
                      value={forgotForm.cedula}
                      onChange={handleForgotChange}
                    />
                  </div>
                  {forgotErrors.cedula && <p className="form-error form-error--light">{forgotErrors.cedula}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="forgot-new-password">Nueva contraseña</label>
                  <div className={forgotInputClass('newPassword')}>
                    <Lock className="input-icon" size={18} />
                    <input
                      id="forgot-new-password"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu nueva contraseña"
                      value={forgotForm.newPassword}
                      onChange={handleForgotChange}
                    />
                    <button
                      type="button"
                      className="toggle-password toggle-password--light"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label="Mostrar contraseña"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {forgotErrors.newPassword && (
                    <p className="form-error form-error--light">{forgotErrors.newPassword}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="forgot-confirm-password">Confirmar nueva contraseña</label>
                  <div className={forgotInputClass('confirmPassword')}>
                    <Lock className="input-icon" size={18} />
                    <input
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      type={showConfirmNew ? 'text' : 'password'}
                      placeholder="Confirma tu nueva contraseña"
                      value={forgotForm.confirmPassword}
                      onChange={handleForgotChange}
                    />
                    <button
                      type="button"
                      className="toggle-password toggle-password--light"
                      onClick={() => setShowConfirmNew((v) => !v)}
                      aria-label="Mostrar contraseña"
                    >
                      {showConfirmNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {forgotErrors.confirmPassword && (
                    <p className="form-error form-error--light">{forgotErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="forgot-codigo">Clave especial</label>
                  <div className={forgotInputClass('codigo')}>
                    <KeyRound className="input-icon" size={18} />
                    <input
                      id="forgot-codigo"
                      name="codigo"
                      type="password"
                      placeholder=""
                      autoComplete="off"
                      value={forgotForm.codigo}
                      onChange={handleForgotChange}
                    />
                  </div>
                  {forgotErrors.codigo ? (
                    <p className="form-error form-error--light">{forgotErrors.codigo}</p>
                  ) : (
                    <p className="forgot-panel__hint">Clave de administrador obligatoria para cambiar la contraseña</p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn--gold forgot-panel__btn"
                  onClick={handleForgotSubmit}
                >
                  Guardar nueva contraseña
                </button>
              </div>
            )}
          </div>
        )}

        <div className="login-panel__logo" aria-hidden="true">
          <BrandLogo variant="main" alt="" />
        </div>

        <button type="submit" className="btn btn--gold">
          <LogIn size={20} />
          Ingresar
        </button>
      </form>
    </section>
  )
}
