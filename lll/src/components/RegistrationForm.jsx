import { useState } from 'react'
import {
  UserPlus,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  HardHat,
  Check,
  CheckCircle2,
} from 'lucide-react'
import { saveUser } from '../utils/users'
import { isDeveloperCedula } from '../constants/auth'
import './RegistrationForm.css'

const REQUIRED_FIELDS = ['nombre', 'apellido', 'cedula', 'password', 'confirmPassword']

const FIELD_LABELS = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  cedula: 'Cédula',
  password: 'Contraseña',
  confirmPassword: 'Confirmar contraseña',
}

function FieldError({ error }) {
  if (!error) return null
  return <p className="form-error">{error}</p>
}

function getValidationErrors(data) {
  const next = {}

  REQUIRED_FIELDS.forEach((field) => {
    if (!data[field].trim()) {
      next[field] = 'Dato obligatorio'
    }
  })

  if (!next.confirmPassword && data.password.trim() && data.confirmPassword.trim()) {
    if (data.password !== data.confirmPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden'
    }
  }

  if (!next.cedula && isDeveloperCedula(data.cedula)) {
    next.cedula = 'Esta cédula está reservada para la cuenta de desarrollador'
  }

  return next
}

export default function RegistrationForm({ inDashboard = false }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [errors, setErrors] = useState({})
  const [role, setRole] = useState('administrador')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)

    if (attemptedSubmit) {
      setErrors(getValidationErrors(updated))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    const validationErrors = getValidationErrors(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }
    const saved = saveUser({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      password: form.password,
      role,
    })

    if (!saved) {
      setErrors({ cedula: 'No se pudo registrar este usuario' })
      return
    }

    setForm((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }))
    setErrors({})
    setAttemptedSubmit(false)
    setShowSuccess(true)
  }

  const inputClass = (field) =>
    attemptedSubmit && errors[field] ? 'input-wrapper input-wrapper--error' : 'input-wrapper'

  const showSummary = attemptedSubmit && Object.keys(errors).length > 0

  return (
    <section className={`register-panel ${inDashboard ? 'register-panel--dashboard' : ''}`}>
      {showSuccess && (
        <div className="auth-message-overlay" role="dialog" aria-modal="true">
          <div className="auth-message">
            <CheckCircle2 className="auth-message__icon" size={48} />
            <h3 className="auth-message__title">{inDashboard ? 'Usuario registrado' : 'Cuenta creada'}</h3>
            <p className="auth-message__text">
              {inDashboard
                ? 'El usuario fue registrado correctamente en el sistema.'
                : 'Tu cuenta fue registrada correctamente. Ahora inicia sesión con tu cédula y contraseña.'}
            </p>
            <button
              type="button"
              className="btn btn--green auth-message__btn"
              onClick={() => setShowSuccess(false)}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="panel-header">
        <div className="panel-header__icon panel-header__icon--green">
          <UserPlus size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="panel-header__title">{inDashboard ? 'Registrar usuario' : 'Crear cuenta'}</h2>
          <p className="panel-header__subtitle">
            {inDashboard
              ? 'Completa los datos para dar de alta un usuario en el sistema.'
              : 'Completa los datos para registrarte en el sistema.'}
          </p>
        </div>
      </div>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        {showSummary && Object.keys(errors).length > 0 && (
          <p className="form-summary-error" role="alert">
            Todos los datos son obligatorios. Completa:{' '}
            {Object.keys(errors)
              .map((key) => FIELD_LABELS[key])
              .join(', ')}
            .
          </p>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <div className={inputClass('nombre')}>
              <User className="input-icon" size={18} />
              <input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Ingresa tu nombre"
                value={form.nombre}
                onChange={handleChange}
                aria-invalid={!!errors.nombre}
              />
            </div>
            <FieldError error={errors.nombre} />
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <div className={inputClass('apellido')}>
              <User className="input-icon" size={18} />
              <input
                id="apellido"
                name="apellido"
                type="text"
                placeholder="Ingresa tu apellido"
                value={form.apellido}
                onChange={handleChange}
                aria-invalid={!!errors.apellido}
              />
            </div>
            <FieldError error={errors.apellido} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cedula">Cédula</label>
          <div className={inputClass('cedula')}>
            <User className="input-icon" size={18} />
            <input
              id="cedula"
              name="cedula"
              type="text"
              inputMode="numeric"
              placeholder="Ingresa tu cédula"
              value={form.cedula}
              onChange={handleChange}
              aria-invalid={!!errors.cedula}
            />
          </div>
          <FieldError error={errors.cedula} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className={inputClass('password')}>
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Crea una contraseña"
                value={form.password}
                onChange={handleChange}
                aria-invalid={!!errors.password}
              />
            </div>
            <FieldError error={errors.password} />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className={inputClass('confirmPassword')}>
              <Lock className="input-icon" size={18} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError error={errors.confirmPassword} />
          </div>
        </div>

        <div className="form-group">
          <span className="form-label">Rol</span>
          <div className="role-cards">
            <button
              type="button"
              className={`role-card ${role === 'administrador' ? 'role-card--selected' : ''}`}
              onClick={() => setRole('administrador')}
            >
              {role === 'administrador' && (
                <span className="role-card__check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
              <ShieldCheck className="role-card__icon" size={28} />
              <span className="role-card__name">Administrador</span>
              <span className="role-card__desc">Acceso total al sistema</span>
            </button>
            <button
              type="button"
              className={`role-card ${role === 'trabajador' ? 'role-card--selected' : ''}`}
              onClick={() => setRole('trabajador')}
            >
              {role === 'trabajador' && (
                <span className="role-card__check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
              <HardHat className="role-card__icon" size={28} />
              <span className="role-card__name">Trabajador</span>
              <span className="role-card__desc">Registro y consulta de información</span>
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn--green">
          <UserPlus size={20} />
          {inDashboard ? 'Registrar usuario' : 'Crear cuenta'}
        </button>
      </form>
    </section>
  )
}
