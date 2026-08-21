import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { GRADES, ROLES, initialsFromName } from '../data'
import { uploadImage } from '../lib/cloudinary'

export default function ProfileModal({ onClose }) {
  const { profile, saveProfile } = useAuth()
  const fileRef = useRef(null)
  const [name, setName] = useState(profile?.name || '')
  const [grade, setGrade] = useState(profile?.grade || 'Junior')
  const [major, setMajor] = useState(profile?.major || 'RTF')
  const [roles, setRoles] = useState(profile?.roles || [])
  const [photoUrl] = useState(profile?.photoUrl || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(profile?.photoUrl || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function toggleRole(role) {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    )
  }

  function takeFile(list) {
    const file = list?.[0]
    if (!file?.type.startsWith('image/')) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (!name.trim() || !grade || !major.trim() || !roles.length) {
      setError('Fill in your name, grade, major, and roles.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const nextPhoto = photoFile ? await uploadImage(photoFile, 'profile', { maxWidth: 800 }) : photoUrl
      await saveProfile({
        name: name.trim(),
        grade,
        major: major.trim(),
        roles,
        photoUrl: nextPhoto,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Couldn’t save your profile.')
      setBusy(false)
    }
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <h2 id="profile-title" className="profile-modal-title">
            Edit profile
          </h2>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form className="upload-fields" onSubmit={onSubmit}>
          <div className="field">
            <span className="field-label">Profile photo</span>
            <div className="profile-photo">
              <button
                type="button"
                className="profile-photo-btn"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  takeFile(event.dataTransfer.files)
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="" />
                ) : (
                  <span className="profile-photo-fallback">{initialsFromName(name)}</span>
                )}
              </button>
              <div>
                <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
                  {photoPreview ? 'Replace photo' : 'Upload photo'}
                </button>
                <p className="field-help">Drop an image on the circle, or click to upload.</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  takeFile(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          </div>
          <label className="field">
            <span className="field-label">Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Reyes" />
          </label>
          <div className="form-split">
            <label className="field">
              <span className="field-label">Grade</span>
              <select className="field-select" value={grade} onChange={(event) => setGrade(event.target.value)}>
                {GRADES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Major</span>
              <input value={major} onChange={(event) => setMajor(event.target.value)} placeholder="RTF" />
            </label>
          </div>
          <div className="field">
            <span className="field-label">Roles on set</span>
            <div className="chips">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`chip${roles.includes(role) ? ' is-on' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="upload-modal-foot">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="solid-btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
