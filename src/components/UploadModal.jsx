import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Timestamp,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import Icon from './Icon'
import ThumbPicker from './ThumbPicker'
import CrewCredits from './CrewCredits'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { COURSES, GENRES } from '../data'
import { fetchVideoMeta } from '../lib/video'
import { uploadImage } from '../lib/cloudinary'
import { upsertCreditInvites, sendFilmCreditInvites } from '../lib/invites'

const STEPS = [
  {
    label: 'Link',
    title: 'Add the video',
    copy: 'Paste a YouTube or Vimeo link. We’ll pull the runtime and a starting still.',
  },
  {
    label: 'Thumb',
    title: 'Pick a thumbnail',
    copy: 'Replace the default still with your own image.',
  },
  {
    label: 'Info',
    title: 'Film info',
    copy: 'Title, logline, genre, and course.',
  },
  {
    label: 'Crew',
    title: 'Cast & crew',
    copy: 'Everyone you tag has to accept before the credit shows on their profile.',
  },
  {
    label: 'Post',
    title: 'Final settings',
    copy: 'Visibility is locked at publish, so pick this carefully.',
  },
]

function normalizeGenre(item) {
  return item === 'Doc' ? 'Documentary' : item
}

function genresFromFilm(film) {
  const list = (film?.genres || (film?.genre ? [film.genre] : [])).map(normalizeGenre)
  return Object.fromEntries(list.map((item) => [item, true]))
}

async function persistPoster(file) {
  return uploadImage(file, 'thumbnail')
}

export default function UploadModal({ film, onClose }) {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [step, setStep] = useState(0)
  const [link, setLink] = useState(film?.videoUrl || '')
  const [resolved, setResolved] = useState(Boolean(film?.videoUrl))
  const [host, setHost] = useState(film?.host || '')
  const [videoId, setVideoId] = useState(film?.videoId || '')
  const [videoUrl, setVideoUrl] = useState(film?.videoUrl || '')
  const [poster, setPoster] = useState(film?.poster || '')
  const [sourcePoster, setSourcePoster] = useState(film?.poster || '')
  const [posterFile, setPosterFile] = useState(null)
  const [durationLabel, setDurationLabel] = useState(film?.durationLabel || film?.dur || '')
  const [title, setTitle] = useState(film?.title || '')
  const [logline, setLogline] = useState(film?.logline || '')
  const [genres, setGenres] = useState(genresFromFilm(film))
  const [course, setCourse] = useState(film?.course || 'Not for a class')
  const [crew, setCrew] = useState(film?.crew || [])
  const [vis, setVis] = useState(film?.visibility === 'embargo' || film?.status === 'embargoed' ? 'embargo' : film?.visibility || 'public')
  const [embargoDate, setEmbargoDate] = useState(
    film?.embargoUntil?.toDate ? film.embargoUntil.toDate().toISOString().slice(0, 10) : '',
  )
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [farthest, setFarthest] = useState(film?.id ? STEPS.length - 1 : 0)
  const current = STEPS[step]
  const invitedCount = crew.filter((person) => person.state === 'invited').length
  const courseOptions = COURSES.includes(course) || !course ? COURSES : [...COURSES, course]

  const applyImageFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return
    setPosterFile(file)
    setPoster((currentPoster) => {
      if (currentPoster.startsWith('blob:')) URL.revokeObjectURL(currentPoster)
      return URL.createObjectURL(file)
    })
  }, [])

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      if (document.querySelector('.credit-dialog')) return
      onClose()
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
      if (poster.startsWith('blob:')) URL.revokeObjectURL(poster)
    }
  }, [poster])

  async function fetchLink() {
    setFetchError('')
    if (!link.trim()) return false
    try {
      const meta = await fetchVideoMeta(link.trim())
      setResolved(true)
      setHost(meta.host)
      setVideoId(meta.id)
      setVideoUrl(meta.url)
      setSourcePoster(meta.poster)
      setPosterFile(null)
      setPoster((currentPoster) => {
        if (currentPoster.startsWith('blob:')) URL.revokeObjectURL(currentPoster)
        return meta.poster
      })
      if (meta.durationLabel) setDurationLabel(meta.durationLabel)
      if (meta.title) setTitle((value) => value || meta.title)
      return true
    } catch (err) {
      setResolved(false)
      setFetchError(err.message || 'Couldn’t fetch that link.')
      return false
    }
  }

  function canAdvance() {
    if (step === 0) return Boolean(link.trim())
    if (step === 1) return Boolean(poster)
    if (step === 2) return Boolean(title.trim())
    return true
  }

  async function goNext() {
    if (step === 0) {
      const ok = resolved || (await fetchLink())
      if (!ok) return
    }
    if (!canAdvance()) return
    const next = Math.min(step + 1, STEPS.length - 1)
    setStep(next)
    setFarthest((max) => Math.max(max, next))
  }

  function toggleGenre(label) {
    setGenres((currentGenres) => ({ ...currentGenres, [label]: !currentGenres[label] }))
  }

  async function save(asDraft) {
    if (!user || !profile) return
    if (!asDraft && vis === 'embargo' && !embargoDate) {
      setFetchError('Pick the date the embargo lifts.')
      setSaving(false)
      return
    }
    setSaving(true)
    const selectedGenres = GENRES.filter((item) => genres[item])
    const visibility = asDraft ? 'unlisted' : vis
    const status = asDraft ? 'draft' : vis === 'embargo' ? 'embargoed' : 'published'
    try {
      const posterUrl = posterFile ? await persistPoster(posterFile) : poster
      const payload = {
        ownerId: user.uid,
        ownerName: profile.name,
        title: title.trim(),
        logline: logline.trim(),
        genres: selectedGenres,
        course,
        videoUrl,
        videoId,
        host,
        poster: posterUrl,
        durationLabel,
        visibility,
        embargoUntil:
          !asDraft && vis === 'embargo' ? Timestamp.fromDate(new Date(`${embargoDate}T00:00:00`)) : null,
        status,
        crew: crew.map((member) => ({
          name: member.name,
          role: member.role,
          kind: member.kind || 'crew',
          state: member.state,
          userId: member.userId || null,
          email: member.email || null,
          inviteToken: member.inviteToken || null,
          inviteSentAt: member.inviteSentAt || null,
        })),
        crewUids: crew.map((member) => member.userId).filter(Boolean),
        views30d: film?.views30d || 0,
        updatedAt: serverTimestamp(),
      }
      let filmId = film?.id
      if (filmId) {
        await updateDoc(doc(db, 'films', filmId), payload)
      } else {
        const created = await addDoc(collection(db, 'films'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        filmId = created.id
      }
      await upsertCreditInvites({
        filmId,
        title: payload.title,
        poster: posterUrl,
        logline: payload.logline,
        visibility,
        ownerId: user.uid,
        ownerName: profile.name,
        crew: payload.crew,
      })
      if (status === 'published' && payload.crew.some((member) => member.state === 'invited' && member.email)) {
        await sendFilmCreditInvites(filmId)
      }
      onClose()
      navigate('/projects')
    } catch (err) {
      setFetchError(err.message || 'Couldn’t save the project.')
      setSaving(false)
    }
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <div className="upload-stepper" role="tablist" aria-label="Upload steps">
            {STEPS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={`upload-step${index === step ? ' is-on' : ''}${index !== step && index <= farthest ? ' is-done' : ''}`}
                disabled={index > farthest}
                onClick={() => {
                  if (index <= farthest) setStep(index)
                }}
              >
                <span>{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div className="upload-modal-copy">
          <div className="upload-step-kicker">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 id="upload-title">{current.title}</h2>
          <p>{current.copy}</p>
        </div>

        <div className="upload-fields">
          {step === 0 && (
            <>
              <div className="field">
                <span className="field-label">Video link</span>
                <div className="field-row">
                  <input
                    value={link}
                    onChange={(event) => {
                      setLink(event.target.value)
                      setResolved(false)
                    }}
                    placeholder="https://vimeo.com/… or YouTube"
                    autoFocus
                  />
                  <button type="button" className="ghost-btn" onClick={fetchLink}>
                    Fetch
                  </button>
                </div>
              </div>
              {fetchError && <p className="auth-error">{fetchError}</p>}
              {resolved && (
                <div className="fetch-result">
                  <div className="fetch-cover">
                    {poster ? <img src={poster} alt="" /> : null}
                  </div>
                  <div>
                    <div className="fetch-ok">{host === 'youtube' ? 'YouTube' : 'Vimeo'} · found</div>
                    <div className="fetch-meta">
                      {[durationLabel, host].filter(Boolean).join(' · ')}
                    </div>
                    <div className="fetch-note">You’ll pick the thumbnail on the next step.</div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <ThumbPicker
              poster={poster}
              sourcePoster={sourcePoster}
              custom={Boolean(posterFile)}
              onSelectFile={applyImageFile}
              onReset={() => {
                setPosterFile(null)
                setPoster((currentPoster) => {
                  if (currentPoster.startsWith('blob:')) URL.revokeObjectURL(currentPoster)
                  return sourcePoster
                })
              }}
            />
          )}

          {step === 2 && (
            <>
              <label className="field">
                <span className="field-label">Title</span>
                <input
                  className="title-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled"
                  autoFocus
                />
              </label>
              <label className="field">
                <span className="field-label-row">
                  <span className="field-label">Logline</span>
                  <span className="field-count">{logline.length}/140</span>
                </span>
                <input
                  value={logline}
                  onChange={(event) => setLogline(event.target.value.slice(0, 140))}
                  placeholder="One sentence. What happens, and to whom?"
                />
              </label>
              <div className="field">
                <span className="field-label">Genre</span>
                <div className="chips">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`chip${genres[g] ? ' is-on' : ''}`}
                      onClick={() => toggleGenre(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span className="field-label">Course</span>
                <select
                  className="field-select"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                >
                  {courseOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {step === 3 && <CrewCredits crew={crew} setCrew={setCrew} user={user} profile={profile} />}

          {step === 4 && (
            <>
              <div className="field-label">Visibility</div>
              {[
                ['public', 'Public', 'Anyone with the link, listed in Home and Search.'],
                ['unlisted', 'Unlisted', "Link only. Won't appear in feeds or search."],
                ['embargo', 'Embargoed until a date', 'Locked for festival eligibility. Publishes itself when the date hits.'],
              ].map(([id, label, desc]) => (
                <button
                  key={id}
                  type="button"
                  className={`vis-option${vis === id ? ' is-on' : ''}`}
                  onClick={() => setVis(id)}
                >
                  <span className={`radio${vis === id ? ' is-on' : ''}`} />
                  <span>
                    <span className="vis-label">{label}</span>
                    <span className="vis-desc">{desc}</span>
                  </span>
                </button>
              ))}
              {vis === 'embargo' && (
                <div className="embargo-box">
                  <div className="field-label">Lifts on</div>
                  <div className="field-row">
                    <input
                      type="date"
                      value={embargoDate}
                      onChange={(event) => setEmbargoDate(event.target.value)}
                    />
                    <p className="field-help">
                      Hidden from Home, Search, and your portfolio until this date. Set now — it
                      can’t be loosened later, so festivals stay happy.
                    </p>
                  </div>
                </div>
              )}
              {fetchError && <p className="auth-error">{fetchError}</p>}
            </>
          )}
        </div>

        <div className="upload-modal-foot">
          {step > 0 ? (
            <button type="button" className="ghost-btn" onClick={() => setStep((currentStep) => currentStep - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="solid-btn" onClick={goNext} disabled={!canAdvance()}>
              Continue
            </button>
          ) : (
            <div className="upload-modal-finish">
              <button type="button" className="ghost-btn" disabled={saving} onClick={() => save(true)}>
                Save as draft
              </button>
              <button type="button" className="solid-btn" disabled={saving} onClick={() => save(false)}>
                {vis === 'embargo' ? 'Schedule project' : 'Publish project'}
              </button>
            </div>
          )}
        </div>
        {step === STEPS.length - 1 && (
          <>
            <p className="upload-note">
              {invitedCount
                ? `${invitedCount} ${invitedCount === 1 ? 'person' : 'people'} will get an email invite to claim their credit when you publish.`
                : crew.length
                  ? 'Everyone tagged already has an account.'
                  : 'You can tag crew later from My Projects.'}
            </p>
            {fetchError ? <p className="auth-error">{fetchError}</p> : null}
          </>
        )}
      </div>
    </div>
  )
}
