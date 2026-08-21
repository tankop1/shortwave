import { useEffect, useState } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import Icon from './Icon'
import { db } from '../firebase'
import { CREW_ROLES, avatar, hueFromName, roleChip } from '../data'

function memberKind(member) {
  if (member.kind === 'cast' || member.kind === 'crew') return member.kind
  return CREW_ROLES.includes(member.role) ? 'crew' : 'cast'
}

export default function CrewCredits({ crew, setCrew, user }) {
  const [kind, setKind] = useState(null)

  const cast = crew.filter((member) => memberKind(member) === 'cast')
  const crewList = crew.filter((member) => memberKind(member) === 'crew')

  function removeAt(index) {
    setCrew((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="crew-step">
      <div className="credit-toolbar">
        <button type="button" className="ghost-btn" onClick={() => setKind('cast')}>
          <Icon name="plus" />
          Add Cast
        </button>
        <button type="button" className="ghost-btn" onClick={() => setKind('crew')}>
          <Icon name="plus" />
          Add Crew
        </button>
      </div>
      <div className="credit-board">
        {crew.length === 0 ? (
          <p className="credit-board-empty">Nobody tagged yet. Add cast and crew to preview them here.</p>
        ) : (
          <>
            {cast.length > 0 && (
              <section className="credit-board-section">
                <div className="field-label">Cast</div>
                {crew.map((person, index) =>
                  memberKind(person) === 'cast' ? (
                    <CreditRow
                      key={`cast-${index}`}
                      person={person}
                      onRemove={() => removeAt(index)}
                    />
                  ) : null,
                )}
              </section>
            )}
            {crewList.length > 0 && (
              <section className="credit-board-section">
                <div className="field-label">Crew</div>
                {crew.map((person, index) =>
                  memberKind(person) === 'crew' ? (
                    <CreditRow
                      key={`crew-${index}`}
                      person={person}
                      onRemove={() => removeAt(index)}
                    />
                  ) : null,
                )}
              </section>
            )}
          </>
        )}
      </div>
      {kind && (
        <CreditDialog
          kind={kind}
          crew={crew}
          user={user}
          onClose={() => setKind(null)}
          onAdd={(member) => {
            setCrew((current) => [...current, member])
            setKind(null)
          }}
        />
      )}
    </div>
  )
}

function CreditRow({ person, onRemove }) {
  const chip = roleChip(person.role)
  return (
    <div className="credit-board-row">
      <span className="credit-avatar" style={{ background: avatar(person.hue || hueFromName(person.name)) }} />
      <span className="credit-board-name">{person.name}</span>
      <span className="credit-role" style={{ color: chip.color }}>
        {person.role}
      </span>
      <span className="crew-state">{person.state}</span>
      <button type="button" className="crew-remove" onClick={onRemove} aria-label={`Remove ${person.name}`}>
        ×
      </button>
    </div>
  )
}

function CreditDialog({ kind, crew, user, onClose, onAdd }) {
  const isCast = kind === 'cast'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState(isCast ? '' : '')
  const [otherRole, setOtherRole] = useState('')
  const [picked, setPicked] = useState(null)
  const [people, setPeople] = useState([])

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const q = name.trim().toLowerCase()
    if (picked || q.length < 2 || q.includes('@')) {
      setPeople([])
      return undefined
    }
    const peopleQuery = query(
      collection(db, 'users'),
      where('nameLower', '>=', q),
      where('nameLower', '<=', `${q}\uf8ff`),
      limit(6),
    )
    getDocs(peopleQuery)
      .then((snap) => {
        setPeople(
          snap.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .filter((person) => person.id !== user?.uid)
            .filter((person) => !crew.some((member) => member.userId === person.id)),
        )
      })
      .catch(() => setPeople([]))
    return undefined
  }, [name, picked, crew, user])

  const roleValue = position === 'Other' ? otherRole.trim() : position.trim()
  const inviteEmail = picked ? '' : email.trim() || (name.includes('@') ? name.trim() : '')
  const displayName = picked?.name || (name.includes('@') ? name.split('@')[0] : name.trim())
  const canSave = Boolean(
    displayName && (picked || inviteEmail.includes('@')) && (isCast || roleValue),
  )

  function pickPerson(person) {
    setPicked(person)
    setName(person.name)
    setEmail('')
    setPeople([])
  }

  function save() {
    if (!canSave) return
    onAdd({
      name: displayName,
      role: isCast ? roleValue || 'Cast' : roleValue,
      kind,
      state: picked ? 'pending' : 'invited',
      userId: picked?.id || null,
      email: picked ? picked.email || null : inviteEmail,
      hue: hueFromName(displayName),
    })
  }

  return (
    <div className="credit-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="credit-dialog-top">
          <h3 id="credit-dialog-title">{isCast ? 'Add cast' : 'Add crew'}</h3>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            value={name}
            onChange={(event) => {
              const value = event.target.value
              setName(value)
              setPicked(null)
              if (value.includes('@')) setEmail(value.trim())
            }}
            placeholder="Search a student…"
            autoFocus
          />
          {people.length > 0 && (
            <div className="suggest-list">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="suggest-item"
                  onClick={() => pickPerson(person)}
                >
                  <span className="credit-avatar" style={{ background: avatar(hueFromName(person.name)) }} />
                  <span>{person.name}</span>
                  <span className="suggest-hint">{(person.roles || []).join(' · ')}</span>
                </button>
              ))}
            </div>
          )}
          {picked ? (
            <p className="field-help">Matched to their Shortwave account. They’ll confirm this credit.</p>
          ) : (
            <p className="field-help">If they’re not on Shortwave yet, add their email below to invite them.</p>
          )}
        </label>
        {!picked && (
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@utexas.edu"
            />
          </label>
        )}
        {isCast ? (
          <label className="field">
            <span className="field-label">Character</span>
            <input
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="e.g. Ana"
            />
          </label>
        ) : (
          <>
            <label className="field">
              <span className="field-label">Role</span>
              <select
                className="field-select"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              >
                <option value="">Select a role</option>
                {CREW_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </label>
            {position === 'Other' && (
              <label className="field">
                <span className="field-label">Custom role</span>
                <input
                  value={otherRole}
                  onChange={(event) => setOtherRole(event.target.value)}
                  placeholder="e.g. Script supervisor"
                />
              </label>
            )}
          </>
        )}
        <div className="credit-dialog-foot">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="solid-btn" disabled={!canSave} onClick={save}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
