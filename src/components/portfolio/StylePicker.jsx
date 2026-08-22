import { useEffect } from 'react'
import Icon from '../Icon'
import { ACCENTS, COLOR_MODES, FONT_PAIRS, normalizeSiteStyle } from '../../lib/siteStyle'

export default function StylePicker({ portfolio, onChange, onClose }) {
  const style = normalizeSiteStyle(portfolio)
  const modeIndex = Math.max(0, COLOR_MODES.findIndex((item) => item.id === style.colorMode))

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

  function patch(partial) {
    onChange?.({ ...style, ...partial })
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal psite-style-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <h2 id="style-picker-title" className="profile-modal-title">
            Style your site
          </h2>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <section className="psite-style-section">
          <span className="field-label">Typography</span>
          <div className="psite-font-grid">
            {FONT_PAIRS.map((pair) => (
              <button
                key={pair.id}
                type="button"
                className={`psite-font-card${style.fontPair === pair.id ? ' is-on' : ''}`}
                onClick={() => patch({ fontPair: pair.id })}
              >
                <span
                  className="psite-font-card-aa"
                  style={{ fontFamily: pair.display, fontWeight: pair.displayWeight || 800 }}
                >
                  Aa
                </span>
                <span className="psite-font-card-sample" style={{ fontFamily: pair.sans }}>
                  I’ll make your film
                </span>
                <span className="psite-font-card-name">{pair.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="psite-style-section">
          <span className="field-label">Color mode</span>
          <div className="psite-mode-slider" style={{ '--mode-i': modeIndex }} role="radiogroup" aria-label="Color mode">
            <span className="psite-mode-slider-thumb" aria-hidden="true" />
            {COLOR_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={style.colorMode === item.id}
                className={style.colorMode === item.id ? 'is-on' : undefined}
                onClick={() => patch({ colorMode: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="psite-style-section">
          <span className="field-label">Accent color</span>
          <div className="psite-swatch-grid">
            {ACCENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`psite-swatch${style.accent === item.id ? ' is-on' : ''}`}
                style={{ background: item.hex }}
                aria-label={item.label}
                title={item.label}
                onClick={() => patch({ accent: item.id })}
              />
            ))}
          </div>
        </section>

        <div className="upload-modal-foot">
          <span />
          <button type="button" className="solid-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
