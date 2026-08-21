import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { db } from '../firebase'
import { statusKind, statusLabel } from '../data'

export default function Projects() {
  const { myFilms, pendingCredits, onUpload, onEdit, user } = useOutletContext()
  const [dismissed, setDismissed] = useState([])

  const pending = pendingCredits.filter((film) => !dismissed.includes(film.id))
  const embargoed = myFilms.filter((film) => film.status === 'embargoed').length
  const waiting = pending.length

  async function acceptCredit(film) {
    if (!user) return
    const crew = (film.crew || []).map((member) =>
      member.userId === user.uid ? { ...member, state: 'accepted' } : member,
    )
    await updateDoc(doc(db, 'films', film.id), { crew })
  }

  function disputeCredit(film) {
    setDismissed((current) => [...current, film.id])
  }

  return (
    <main className="page projects-page">
      <div className="page-head-row">
        <div className="page-head page-head-sm">
          <h1>My projects</h1>
          {myFilms.length > 0 && (
            <p>
              {myFilms.length} {myFilms.length === 1 ? 'film' : 'films'}
              {embargoed ? ` · ${embargoed} embargoed` : ''}
              {waiting ? ` · ${waiting} credit${waiting === 1 ? '' : 's'} waiting on you` : ''}
            </p>
          )}
        </div>
        {myFilms.length > 0 && (
          <button type="button" className="upload-solid" onClick={onUpload}>
            <Icon name="plus" className="icon-dark" />
            Add a project
          </button>
        )}
      </div>

      {pending.map((film) => {
        const credit = (film.crew || []).find((member) => member.userId === user.uid)
        return (
          <div key={film.id} className="credit-banner">
            <div>
              <div className="credit-banner-title">
                {film.ownerName} credited you as <em>{credit?.role || 'crew'}</em> on “{film.title}”
              </div>
              <div className="credit-banner-copy">
                It won’t show on your profile or portfolio until you accept.
              </div>
            </div>
            <button type="button" className="solid-btn" onClick={() => acceptCredit(film)}>
              Accept credit
            </button>
            <button type="button" className="ghost-btn" onClick={() => disputeCredit(film)}>
              Dispute
            </button>
          </div>
        )
      })}

      {myFilms.length === 0 ? (
        <div className="empty-panel">
          <Icon name="folder" className="empty-panel-graphic" />
          <p>Your projects are empty</p>
          <button type="button" className="upload-solid" onClick={onUpload}>
            Add a project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {myFilms.map((film) => (
            <div key={film.id} className="project-row">
              <div className="project-still">
                {film.poster ? <img src={film.poster} alt="" /> : <div className="project-still-empty" />}
              </div>
              <div className="project-body">
                <div className="project-title-row">
                  <span className="project-title">{film.title}</span>
                  <span className={`status-pill status-${statusKind(film)}`}>{statusLabel(film)}</span>
                </div>
                <p className="project-logline">{film.logline}</p>
                <button type="button" className="ghost-btn project-edit" onClick={() => onEdit(film)}>
                  Edit
                </button>
              </div>
              <div className="project-stats">
                <div className="project-views">{film.views30d || 0}</div>
                <div className="project-views-label">views · 30d</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
