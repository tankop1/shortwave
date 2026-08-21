import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../auth/AuthContext'
import { GRADES, HEARD_ABOUT, ROLES, isUtEmail } from '../data'
import { INVITE_STORAGE_KEY } from '../lib/invites'

const STEPS = [
  {
    label: 'UT',
    title: 'UT email',
    copy: 'Shortwave is for UT Austin film students. Use your school address.',
  },
  {
    label: 'You',
    title: 'Basic info',
    copy: 'Name, year, major, and the roles you actually take on set.',
  },
  {
    label: 'About',
    title: 'How did you hear about Shortwave?',
    copy: 'Optional — it just helps us know what’s working.',
  },
]

export default function OnboardingModal() {
  const navigate = useNavigate()
  const { user, saveProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [utEmail, setUtEmail] = useState(user?.email && isUtEmail(user.email) ? user.email : '')
  const [name, setName] = useState(user?.displayName || '')
  const [grade, setGrade] = useState('Junior')
  const [major, setMajor] = useState('RTF')
  const [roles, setRoles] = useState([])
  const [heardAbout, setHeardAbout] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = STEPS[step]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function toggleRole(role) {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    )
  }

  function canAdvance() {
    if (step === 0) return isUtEmail(utEmail)
    if (step === 1) return Boolean(name.trim() && grade && major.trim() && roles.length)
    return true
  }

  async function finish() {
    setError('')
    setBusy(true)
    try {
      await saveProfile({
        name: name.trim(),
        grade,
        major: major.trim(),
        roles,
        utEmail: utEmail.trim().toLowerCase(),
        heardAbout: heardAbout.trim(),
        onboarded: true,
        savedFilmIds: [],
        createdAt: serverTimestamp(),
      })
      const inviteToken = sessionStorage.getItem(INVITE_STORAGE_KEY)
      navigate(inviteToken ? `/invite/${inviteToken}` : '/projects')
    } catch (err) {
      setError(err.message || 'Couldn’t save your profile.')
      setBusy(false)
    }
  }

  return (
    <div className="upload-backdrop" role="presentation">
      <div
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-title"
      >
        <div className="upload-modal-top">
          <div className="upload-stepper" role="tablist" aria-label="Onboarding steps">
            {STEPS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={`upload-step${index === step ? ' is-on' : ''}${index < step ? ' is-done' : ''}`}
                onClick={() => {
                  if (index <= step) setStep(index)
                }}
              >
                <span>{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="upload-modal-copy">
          <div className="upload-step-kicker">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 id="onboard-title">{current.title}</h2>
          <p>{current.copy}</p>
        </div>

        <div className="upload-fields">
          {step === 0 && (
            <label className="field">
              <span className="field-label">UT email</span>
              <input
                type="email"
                value={utEmail}
                onChange={(event) => setUtEmail(event.target.value)}
                placeholder="name@utexas.edu"
                autoFocus
              />
              <span className="field-help">Must end in @utexas.edu or @austin.utexas.edu.</span>
            </label>
          )}

          {step === 1 && (
            <>
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Maya Reyes"
                  autoFocus
                />
              </label>
              <div className="form-split">
                <label className="field">
                  <span className="field-label">Grade</span>
                  <select
                    className="field-select"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                  >
                    {GRADES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Major</span>
                  <input
                    value={major}
                    onChange={(event) => setMajor(event.target.value)}
                    placeholder="RTF"
                  />
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
            </>
          )}

          {step === 2 && (
            <>
              <div className="chips">
                {HEARD_ABOUT.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip${heardAbout === item ? ' is-on' : ''}`}
                    onClick={() => setHeardAbout(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label className="field">
                <span className="field-label">Or write it</span>
                <input
                  value={heardAbout}
                  onChange={(event) => setHeardAbout(event.target.value)}
                  placeholder="A friend in RTF 343"
                />
              </label>
            </>
          )}
          {error && <p className="auth-error">{error}</p>}
        </div>

        <div className="upload-modal-foot">
          {step > 0 ? (
            <button type="button" className="ghost-btn" onClick={() => setStep((current) => current - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="solid-btn"
              disabled={!canAdvance()}
              onClick={() => setStep((current) => current + 1)}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="solid-btn" disabled={busy} onClick={finish}>
              {busy ? 'Saving…' : 'Enter Shortwave'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
