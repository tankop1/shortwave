import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import Icon from './Icon'
import { db } from '../firebase'
import { CREW_ROLES, avatar, formatRolePhrase, formatRoles, hueFromName, memberRoles, roleChip } from '../data'
import { isValidEmail, newInviteToken, rankPeople } from '../lib/invites'

function memberKind(member) {
  if (member.kind === 'cast' || member.kind === 'crew') return member.kind
  return memberRoles(member).some((role) => CREW_ROLES.includes(role)) ? 'crew' : 'cast'
}

export default function CrewCredits({ crew, setCrew, user, profile }) {
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
          profile={profile}
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
  const roles = memberRoles(person)
  const label = formatRoles(roles) || person.role
  const chip = roleChip(roles[0] || person.role)
  return (
    <div className="credit-board-row">
      <PersonAvatar person={person} />
      <span className="credit-board-name">{person.name}</span>
      <span className="credit-role" style={{ color: chip.color }}>
        {label}
      </span>
      <span className="crew-state">{person.state}</span>
      <button type="button" className="crew-remove" onClick={onRemove} aria-label={`Remove ${person.name}`}>
        ×
      </button>
    </div>
  )
}

function PersonAvatar({ person }) {
  if (person.photoUrl) {
    return <img className="credit-avatar" src={person.photoUrl} alt="" />
  }
  return (
    <span
      className="credit-avatar"
      style={{ background: avatar(person.hue || hueFromName(person.name)) }}
    />
  )
}

function CreditDialog({ kind, crew, user, profile, onClose, onAdd }) {
  const isCast = kind === 'cast'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [otherRole, setOtherRole] = useState('')
  const [showOther, setShowOther] = useState(false)
  const [picked, setPicked] = useState(null)
  const [inviteMode, setInviteMode] = useState(false)
  const [directory, setDirectory] = useState([])
  const [directoryReady, setDirectoryReady] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const blurTimer = useRef(0)
  const emailRef = useRef(null)

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (suggestOpen) {
        setSuggestOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, suggestOpen])

  useEffect(() => {
    let cancelled = false
    getDocs(query(collection(db, 'users'), limit(1000)))
      .then((snap) => {
        if (cancelled) return
        const people = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
        if (user?.uid && profile?.name && !people.some((person) => person.id === user.uid)) {
          people.unshift({
            id: user.uid,
            name: profile.name,
            nameLower: profile.name.trim().toLowerCase(),
            email: profile.email || user.email,
            utEmail: profile.utEmail,
            roles: profile.roles,
            photoUrl: profile.photoUrl,
          })
        }
        setDirectory(people)
      })
      .catch(() => {
        if (!cancelled) setDirectory([])
      })
      .finally(() => {
        if (!cancelled) setDirectoryReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [profile, user])

  const matches = useMemo(() => {
    const q = name.trim()
    if (picked || !q) return []
    return rankPeople(directory, q)
      .filter((person) => !crew.some((member) => member.userId === person.id && memberKind(member) === kind))
      .slice(0, 8)
  }, [crew, directory, kind, name, picked])

  const typedName = name.trim()
  const noUserMatch = directoryReady && typedName.length > 0 && matches.length === 0 && !picked
  const showEmail = !picked && (inviteMode || noUserMatch || typedName.includes('@'))
  const showSuggest = suggestOpen && !picked && typedName.length > 0
  const inviteOptionIndex = matches.length
  const optionCount = matches.length + 1

  const roleList = [
    ...selectedRoles,
    ...(showOther && otherRole.trim() ? [otherRole.trim()] : []),
  ]
  const roleValue = isCast ? position.trim() : formatRoles(roleList)
  const inviteEmail = picked ? '' : email.trim() || (typedName.includes('@') ? typedName : '')
  const displayName = picked?.name || (typedName.includes('@') ? typedName.split('@')[0] : typedName)
  const canSave = Boolean(
    displayName &&
      (isCast || roleList.length) &&
      (picked || ((inviteMode || noUserMatch || typedName.includes('@')) && isValidEmail(inviteEmail))),
  )

  function toggleRole(role) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    )
  }

  function pickPerson(person) {
    setPicked(person)
    setName(person.name)
    setEmail('')
    setInviteMode(false)
    setSuggestOpen(false)
  }

  function startInvite() {
    setPicked(null)
    setInviteMode(true)
    setSuggestOpen(false)
    if (typedName.includes('@')) setEmail(typedName)
    window.setTimeout(() => emailRef.current?.focus(), 0)
  }

  function onNameChange(value) {
    setName(value)
    setPicked(null)
    setSuggestOpen(true)
    setActiveIndex(0)
    if (value.includes('@')) {
      setInviteMode(true)
      setEmail(value.trim())
      return
    }
    if (inviteMode) return
    setInviteMode(false)
  }

  function onNameKeyDown(event) {
    if (!showSuggest) {
      if (event.key === 'ArrowDown' && typedName) setSuggestOpen(true)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % optionCount)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + optionCount) % optionCount)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= matches.length) startInvite()
      else if (matches[activeIndex]) pickPerson(matches[activeIndex])
    }
  }

  function save() {
    if (!canSave) return
    const roles = isCast ? (roleValue ? [roleValue] : ['Cast']) : roleList
    onAdd({
      name: displayName,
      role: isCast ? roles[0] : formatRolePhrase(roles) || formatRoles(roles),
      roles,
      kind,
      state: picked ? (picked.id === user?.uid ? 'accepted' : 'pending') : 'invited',
      userId: picked?.id || null,
      email: picked ? picked.email || picked.utEmail || null : inviteEmail,
      photoUrl: picked?.photoUrl || null,
      inviteToken: picked ? null : newInviteToken(),
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
        <div className="field">
          <span className="field-label">Name</span>
          <div className="suggest-wrap">
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onFocus={() => typedName && setSuggestOpen(true)}
              onBlur={() => {
                window.clearTimeout(blurTimer.current)
                blurTimer.current = window.setTimeout(() => setSuggestOpen(false), 160)
              }}
              onKeyDown={onNameKeyDown}
              placeholder="Search everyone on Shortwave…"
              autoComplete="off"
              autoFocus
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggest}
              aria-controls="credit-name-suggest"
            />
            {showSuggest && (
              <div className="suggest-list" id="credit-name-suggest" role="listbox">
                {!directoryReady && (
                  <div className="suggest-empty">Searching students…</div>
                )}
                {directoryReady &&
                  matches.map((person, index) => (
                    <button
                      key={person.id}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`suggest-item${index === activeIndex ? ' is-active' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickPerson(person)}
                    >
                      <PersonAvatar person={person} />
                      <span>{person.name}</span>
                      <span className="suggest-hint">
                        {person.id === user?.uid ? 'You' : (person.roles || []).join(' · ')}
                      </span>
                    </button>
                  ))}
                {directoryReady && typedName && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === inviteOptionIndex}
                    className={`suggest-item suggest-invite${activeIndex === inviteOptionIndex ? ' is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={startInvite}
                  >
                    <span className="suggest-invite-icon">
                      <Icon name="plus" />
                    </span>
                    <span>
                      Invite <em>{typedName.includes('@') ? typedName.split('@')[0] : typedName}</em>
                    </span>
                    <span className="suggest-hint">Email them a credit</span>
                  </button>
                )}
              </div>
            )}
          </div>
          {picked ? (
            <p className="field-help">
              {picked.id === user?.uid
                ? 'That’s you. This credit will show as accepted.'
                : 'Matched to their Shortwave account. They’ll confirm this credit.'}
            </p>
          ) : showEmail ? (
            <p className="field-help">They’re not on Shortwave yet. Add an email and we’ll invite them when you publish.</p>
          ) : (
            <p className="field-help">Search the directory, or invite someone who isn’t on Shortwave yet.</p>
          )}
        </div>
        {showEmail && (
          <label className="field">
            <span className="field-label">Email</span>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@utexas.edu"
              required
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
            <div className="field">
              <span className="field-label">Roles</span>
              <div className="chips">
                {CREW_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`chip${selectedRoles.includes(role) ? ' is-on' : ''}`}
                    aria-pressed={selectedRoles.includes(role)}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip${showOther ? ' is-on' : ''}`}
                  aria-pressed={showOther}
                  onClick={() => {
                    setShowOther((on) => {
                      if (on) setOtherRole('')
                      return !on
                    })
                  }}
                >
                  Other
                </button>
              </div>
              <p className="field-help">Select every role they had on this film.</p>
            </div>
            {showOther && (
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
