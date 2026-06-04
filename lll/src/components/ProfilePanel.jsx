import { useState, useEffect } from 'react'
import {
  User,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  HardHat,
  Check,
} from 'lucide-react'
import { CLAVE_ESPECIAL_ADMIN, isDeveloperUser } from '../constants/auth'
import { findUserByCedula, updateUserProfile } from '../utils/users'
import { buildDisplayName } from '../utils/session'
import './ProfilePanel.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="profile-form__error">{error}</p>
}

export default function ProfilePanel({ user, onUserUpdate, onSaved }) {
  const stored = findUserByCedula(user?.cedula) || user
  const displayName = buildDisplayName(stored)
  const isDeveloper = isDeveloperUser(user)

  const [role, setRole] = useState(stored?.role || 'administrador')

  useEffect(() => {
    setRole(user?.role || stored?.role || 'administrador')
  }, [user?.role, stored?.role])
  const [changingPassword, setChangingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
    codigo: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (attemptedSubmit) {
      setErrors(getErrors(updated, role, changingPassword))
    }
  }

  const getErrors = (data, selectedRole, isChangingPassword) => {
    const next = {}

    if (!data.codigo.trim()) {
      next.codigo = 'La clave especial es obligatoria'
    } else if (data.codigo.trim() !== CLAVE_ESPECIAL_ADMIN) {
      next.codigo = 'Clave especial incorrecta'
    }

    if (isChangingPassword) {
      if (!data.newPassword.trim()) {
        next.newPassword = 'Ingresa la nueva contraseña'
      }
      if (!data.confirmPassword.trim()) {
        next.confirmPassword = 'Confirma la nueva contraseña'
      }
      if (
        !next.confirmPassword &&
        data.newPassword.trim() &&
        data.confirmPassword.trim() &&
        data.newPassword !== data.confirmPassword
      ) {
        next.confirmPassword = 'Las contraseñas no coinciden'
      }
    }

    return next
  }

  const hasChanges = () => {
    const roleChanged = role !== (stored?.role || 'administrador')
    const passwordChanged =
      changingPassword && form.newPassword.trim() && form.confirmPassword.trim()
    return roleChanged || passwordChanged
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isDeveloper) return
    setAttemptedSubmit(true)
    const validationErrors = getErrors(form, role, changingPassword)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    if (!hasChanges()) {
      setErrors({ form: 'No hay cambios para guardar' })
      return
    }

    const updates = { role }
    if (changingPassword) {
      updates.password = form.newPassword
    }

    const ok = updateUserProfile(user.cedula, updates)
    if (!ok) {
      setErrors({ form: 'No se pudo actualizar el perfil' })
      return
    }

    const session = {
      nombre: stored.nombre,
      apellido: stored.apellido,
      cedula: stored.cedula,
      role,
    }
    onUserUpdate?.(session)

    setForm({ newPassword: '', confirmPassword: '', codigo: '' })
    setChangingPassword(false)
    setAttemptedSubmit(false)
    setErrors({})
    onSaved?.()
  }

  const inputClass = (field) =>
    attemptedSubmit && errors[field] ? 'profile-input profile-input--error' : 'profile-input'

  return (
    <section className="profile-panel">
      <div className="profile-panel__header">
        <h2 className="profile-panel__title">Mi perfil</h2>
        <p className="profile-panel__subtitle">
          {isDeveloper
            ? 'Cuenta de desarrollador del sistema (solo lectura)'
            : 'Consulta y actualiza tu información de cuenta'}
        </p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p className="profile-form__summary" role="alert">
            {errors.form}
          </p>
        )}

        <div className="profile-form__group">
          <label htmlFor="profile-nombre">Nombre de usuario</label>
          <div className="profile-input profile-input--readonly">
            <User className="profile-input__icon" size={18} />
            <input id="profile-nombre" type="text" value={displayName} readOnly disabled />
          </div>
        </div>

        <div className="profile-form__group">
          <label htmlFor="profile-cedula">Cédula</label>
          <div className="profile-input profile-input--readonly">
            <User className="profile-input__icon" size={18} />
            <input id="profile-cedula" type="text" value={stored?.cedula || ''} readOnly disabled />
          </div>
        </div>

        <div className="profile-form__group">
          <label htmlFor="profile-password">Contraseña</label>
          <div className="profile-input profile-input--readonly">
            <Lock className="profile-input__icon" size={18} />
            <input
              id="profile-password"
              type="password"
              value="••••••••"
              readOnly
              disabled
              aria-label="Contraseña oculta"
            />
          </div>
          {!isDeveloper && (
            <button
              type="button"
              className="profile-form__link"
              onClick={() => {
                setChangingPassword((v) => !v)
                if (changingPassword) {
                  setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }))
                  setErrors({})
                }
              }}
            >
              {changingPassword ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
            </button>
          )}
        </div>

        {changingPassword && !isDeveloper && (
          <div className="profile-form__password-block">
            <div className="profile-form__group">
              <label htmlFor="profile-new-password">Nueva contraseña</label>
              <div className={inputClass('newPassword')}>
                <Lock className="profile-input__icon" size={18} />
                <input
                  id="profile-new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="profile-input__toggle"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldError error={errors.newPassword} />
            </div>

            <div className="profile-form__group">
              <label htmlFor="profile-confirm-password">Confirmar contraseña</label>
              <div className={inputClass('confirmPassword')}>
                <Lock className="profile-input__icon" size={18} />
                <input
                  id="profile-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="profile-input__toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldError error={errors.confirmPassword} />
            </div>
          </div>
        )}

        <div className="profile-form__group">
          <span className="profile-form__label">Rol</span>
          {isDeveloper ? (
            <div className="profile-input profile-input--readonly">
              <ShieldCheck className="profile-input__icon" size={18} />
              <input type="text" value="Desarrollador" readOnly disabled />
            </div>
          ) : (
            <div className="profile-role-cards">
              <button
                type="button"
                className={`profile-role-card ${role === 'administrador' ? 'profile-role-card--selected' : ''}`}
                onClick={() => setRole('administrador')}
              >
                {role === 'administrador' && (
                  <span className="profile-role-card__check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <ShieldCheck className="profile-role-card__icon" size={26} />
                <span className="profile-role-card__name">Administrador</span>
              </button>
              <button
                type="button"
                className={`profile-role-card ${role === 'trabajador' ? 'profile-role-card--selected' : ''}`}
                onClick={() => setRole('trabajador')}
              >
                {role === 'trabajador' && (
                  <span className="profile-role-card__check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <HardHat className="profile-role-card__icon" size={26} />
                <span className="profile-role-card__name">Trabajador</span>
              </button>
            </div>
          )}
        </div>

        {!isDeveloper && (
          <>
            <div className="profile-form__group">
              <label htmlFor="profile-codigo">Clave especial</label>
              <div className={inputClass('codigo')}>
                <KeyRound className="profile-input__icon" size={18} />
                <input
                  id="profile-codigo"
                  name="codigo"
                  type="password"
                  placeholder="Clave para confirmar cambios"
                  autoComplete="off"
                  value={form.codigo}
                  onChange={handleChange}
                />
              </div>
              <FieldError error={errors.codigo} />
              <p className="profile-form__hint">Obligatoria para guardar cualquier cambio</p>
            </div>

            <button type="submit" className="profile-btn profile-btn--green">
              Aceptar
            </button>
          </>
        )}
      </form>
    </section>
  )
}
