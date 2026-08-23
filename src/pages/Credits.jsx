import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProjectListSkeleton } from '../components/Skeleton'
import { db } from '../firebase'
import { formatRolePhrase, memberRoles } from '../data'
import emptyCreditRequestsArt from '../assets/illustrations/Empty Credit Requests Illustration.png'
import emptyMyCreditsArt from '../assets/illustrations/Empty My Credits Illustration.png'

const TABS = [
  { id: 'requests', label: 'Credit requests' },
  { id: 'credits', label: 'My credits' },
]

function userCredit(film, uid) {
  return (film.crew || []).find((member) => member.userId === uid) || null
}

function creditLabel(film, uid) {
  const credit = userCredit(film, uid)
  return formatRolePhrase(memberRoles(credit)) || credit?.role || 'crew'
}

function nextCrewUids(crew) {
  return [
    ...new Set(
      crew
        .filter((member) => member.userId && member.state !== 'declined' && member.state !== 'invited')
        .map((member) => member.userId),
    ),
  ]
}

export default function Credits() {
  const { pendingCredits, acceptedCredits, libraryLoading, onOpen, user } = useOutletContext()
  const [tab, setTab] = useState('requests')
  const [busyId, setBusyId] = useState(null)
  const tabIndex = TABS.findIndex((item) => item.id === tab)

  const requests = pendingCredits || []
  const mine = useMemo(
    () =>
      [...(acceptedCredits || [])].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)),
    [acceptedCredits],
  )

  async function setCreditState(film, state) {
    if (!user || busyId) return
    setBusyId(film.id)
    try {
      const crew = (film.crew || []).map((member) =>
        member.userId === user.uid ? { ...member, state } : member,
      )
      await updateDoc(doc(db, 'films', film.id), { crew, crewUids: nextCrewUids(crew) })
    } finally {
      setBusyId(null)
    }
  }

  if (libraryLoading) {
    return (
      <main className="page credits-page" aria-busy="true">
        <ProjectListSkeleton />
      </main>
    )
  }

  return (
    <main className="page credits-page">
      <div
        className="credits-toggle"
        style={{ '--credits-i': Math.max(0, tabIndex) }}
        role="tablist"
        aria-label="Credits"
      >
        <span className="credits-toggle-thumb" aria-hidden="true" />
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-on' : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        requests.length === 0 ? (
          <div className="empty-panel credits-empty">
            <img src={emptyCreditRequestsArt} alt="" className="empty-panel-art" />
            <p>No credit requests</p>
          </div>
        ) : (
          <div className="project-list">
            {requests.map((film) => (
              <div key={film.id} className="project-row">
                <div className="project-still">
                  {film.poster ? <img src={film.poster} alt="" /> : <div className="project-still-empty" />}
                </div>
                <div className="project-body">
                  <div className="project-title-row">
                    <span className="project-title">{film.title}</span>
                  </div>
                  <p className="project-logline">
                    {film.ownerName || 'A filmmaker'} credited you as {creditLabel(film, user?.uid)}
                  </p>
                  <div className="project-actions">
                    <button
                      type="button"
                      className="solid-btn"
                      disabled={busyId === film.id}
                      onClick={() => setCreditState(film, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={busyId === film.id}
                      onClick={() => setCreditState(film, 'declined')}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : mine.length === 0 ? (
        <div className="empty-panel credits-empty">
          <img src={emptyMyCreditsArt} alt="" className="empty-panel-art" />
          <p>No credits yet</p>
        </div>
      ) : (
        <div className="project-list">
          {mine.map((film) => (
            <div key={film.id} className="project-row">
              <div className="project-still">
                {film.poster ? <img src={film.poster} alt="" /> : <div className="project-still-empty" />}
              </div>
              <div className="project-body">
                <div className="project-title-row">
                  <span className="project-title">{film.title}</span>
                </div>
                <p className="project-logline">
                  Credited as {creditLabel(film, user?.uid)}
                  {film.ownerName ? ` · ${film.ownerName}` : ''}
                </p>
                <div className="project-actions">
                  <button type="button" className="ghost-btn project-edit" onClick={() => onOpen(film.id)}>
                    <Icon name="eye" />
                    See project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
