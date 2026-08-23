import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { markMessageRead, subscribeMessages } from '../lib/messages'
import emptyInboxArt from '../assets/illustrations/Empty Inbox Illustration.png'

function formatWhen(value) {
  const date = value?.toDate?.() instanceof Date ? value.toDate() : null
  if (!date) return 'Just now'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Inbox() {
  const { user, profile } = useOutletContext()
  const [messages, setMessages] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!user?.uid) {
      setMessages([])
      return undefined
    }
    return subscribeMessages(user.uid, setMessages)
  }, [user?.uid])

  async function open(message) {
    setOpenId((current) => (current === message.id ? null : message.id))
    if (!message.read) {
      try {
        await markMessageRead(user.uid, message.id)
      } catch {
        /* ignore */
      }
    }
  }

  const loading = messages == null
  const slug = profile?.portfolioSlug

  return (
    <main className="page inbox-page">
      {loading ? (
        <div className="empty-panel">
          <p>Loading messages…</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-panel">
          <img src={emptyInboxArt} alt="" className="empty-panel-art" />
          <p>No messages yet</p>
          {slug ? (
            <Link to={`/${slug}`} className="upload-solid" target="_blank" rel="noreferrer">
              <Icon name="clapper" className="icon-dark" />
              Open your site
            </Link>
          ) : (
            <Link to="/portfolio" className="upload-solid">
              <Icon name="clapper" className="icon-dark" />
              Set up your site
            </Link>
          )}
        </div>
      ) : (
        <div className="inbox-list">
          {messages.map((message) => {
            const openNow = openId === message.id
            return (
              <article key={message.id} className={`inbox-card${message.read ? '' : ' is-unread'}${openNow ? ' is-open' : ''}`}>
                <button type="button" className="inbox-card-top" onClick={() => open(message)}>
                  <span className="inbox-from">{message.name}</span>
                  <span className="inbox-when">{formatWhen(message.createdAt)}</span>
                  <span className="inbox-preview">{message.message}</span>
                </button>
                {openNow && (
                  <div className="inbox-body">
                    <a className="inbox-email" href={`mailto:${message.email}`}>
                      {message.email}
                    </a>
                    <p>{message.message}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
