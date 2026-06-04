import { useCallback, useEffect, useMemo, useState } from 'react'
import { LockKeyhole, Trash2, UserRound, Users } from 'lucide-react'
import SpecialKeyModal from './SpecialKeyModal'
import './UsersRegisteredPanel.css'
import { deleteUser, listUsers, updateUserPassword } from '../utils/users'

function normalizeRole(role) {
  if (role === 'desarrollador') return 'Desarrollador'
  if (role === 'administrador') return 'Administrador'
  return 'Trabajador'
}

function safeUserLabel(u) {
  return [u?.nombre, u?.apellido].filter(Boolean).join(' ') || u?.cedula || 'Usuario'
}

export default function UsersRegisteredPanel({ currentUser }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [keyAction, setKeyAction] = useState(null)
  const [targetUser, setTargetUser] = useState(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await listUsers()
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isAdmin = useMemo(() => {
    const role = currentUser?.role
    return role === 'administrador' || role === 'desarrollador'
  }, [currentUser?.role])

  const canManage = isAdmin

  const openDelete = (u) => {
    setTargetUser(u)
    setKeyAction('delete')
  }

  const openResetPassword = (u) => {
    setTargetUser(u)
    setNewPassword('')
    setConfirmPassword('')
    setFormError('')
    setKeyAction('resetPassword')
  }

  const closeKeyModal = () => {
    setKeyAction(null)
    setTargetUser(null)
    setFormError('')
  }

  const doDelete = async () => {
    if (!targetUser?.cedula) return
    const ok = await deleteUser(targetUser.cedula)
    closeKeyModal()
    if (ok) await refresh()
  }

  const doResetPassword = async () => {
    if (!targetUser?.cedula) return
    const a = newPassword.trim()
    const b = confirmPassword.trim()
    if (!a || !b) {
      setFormError('Ingresa y confirma la nueva contraseña')
      return
    }
    if (a !== b) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    const ok = await updateUserPassword(targetUser.cedula, a)
    if (!ok) {
      setFormError('No se pudo actualizar la contraseña')
      return
    }
    closeKeyModal()
  }

  if (!canManage) {
    return (
      <section className="users-panel">
        <p className="users-panel__empty">
          No tienes permisos para ver este apartado.
        </p>
      </section>
    )
  }

  return (
    <section className="users-panel">
      <header className="users-panel__head">
        <div className="users-panel__title">
          <Users size={22} />
          <h2>Usuarios registrados</h2>
        </div>
        <button type="button" className="users-panel__refresh" onClick={refresh} disabled={loading}>
          Actualizar
        </button>
      </header>

      {error && <p className="users-panel__error">{error}</p>}

      {loading ? (
        <p className="users-panel__empty">Cargando usuarios...</p>
      ) : items.length === 0 ? (
        <p className="users-panel__empty">No hay usuarios registrados.</p>
      ) : (
        <ul className="users-list">
          {items.map((u) => {
            const isSelf = currentUser?.cedula && u.cedula === currentUser.cedula
            return (
              <li key={u.cedula} className="users-card">
                <div className="users-card__main">
                  <div className="users-card__avatar">
                    <UserRound size={18} />
                  </div>
                  <div className="users-card__info">
                    <p className="users-card__name">{safeUserLabel(u)}</p>
                    <p className="users-card__meta">
                      <span className="users-card__badge">{normalizeRole(u.role)}</span>
                      <span className="users-card__cedula">Cédula: <strong>{u.cedula}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="users-card__actions">
                  <button
                    type="button"
                    className="users-card__btn users-card__btn--key"
                    onClick={() => openResetPassword(u)}
                    disabled={u.role === 'desarrollador'}
                    title={u.role === 'desarrollador' ? 'No aplica para desarrollador' : 'Restablecer contraseña'}
                  >
                    <LockKeyhole size={16} />
                    Contraseña
                  </button>
                  <button
                    type="button"
                    className="users-card__btn users-card__btn--danger"
                    onClick={() => openDelete(u)}
                    disabled={isSelf || u.role === 'desarrollador'}
                    title={isSelf ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {keyAction === 'delete' && (
        <SpecialKeyModal
          title="Eliminar usuario"
          message={`Ingresa la clave especial para eliminar a ${safeUserLabel(targetUser)}. Esta acción desactiva el usuario.`}
          confirmLabel="Eliminar"
          onConfirm={doDelete}
          onCancel={closeKeyModal}
        />
      )}

      {keyAction === 'resetPassword' && (
        <div className="users-reset-overlay" role="dialog" aria-modal="true">
          <div className="users-reset-modal">
            <SpecialKeyModal
              title="Restablecer contraseña"
              message={`Ingresa la clave especial para restablecer la contraseña de ${safeUserLabel(targetUser)}.`}
              confirmLabel="Continuar"
              onConfirm={() => {
                // deja visible el formulario de reset (esta modal contiene ambos pasos)
                setKeyAction('resetForm')
              }}
              onCancel={closeKeyModal}
            />
          </div>
        </div>
      )}

      {keyAction === 'resetForm' && (
        <div className="users-reset-overlay" role="dialog" aria-modal="true">
          <div className="users-reset-modal users-reset-modal--form">
            <h3 className="users-reset-modal__title">Nueva contraseña</h3>
            <p className="users-reset-modal__subtitle">
              Usuario: <strong>{safeUserLabel(targetUser)}</strong> ({targetUser?.cedula})
            </p>

            <div className="users-reset-modal__fields">
              <label className="users-reset-modal__label">
                Nueva contraseña
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setFormError('')
                  }}
                  autoFocus
                />
              </label>
              <label className="users-reset-modal__label">
                Confirmar contraseña
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setFormError('')
                  }}
                />
              </label>
              {formError && <p className="users-reset-modal__error">{formError}</p>}
            </div>

            <div className="users-reset-modal__actions">
              <button type="button" className="users-reset-modal__btn users-reset-modal__btn--ghost" onClick={closeKeyModal}>
                Cancelar
              </button>
              <button type="button" className="users-reset-modal__btn users-reset-modal__btn--confirm" onClick={doResetPassword}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="users-panel__hint">
        Nota: por seguridad, la contraseña no se puede “ver” en texto plano. Solo se puede <strong>restablecer</strong> con la clave especial.
      </p>
    </section>
  )
}

