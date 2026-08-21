import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

export default function ThumbPicker({ poster, sourcePoster, custom, onSelectFile, onReset }) {
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const defaultPoster = sourcePoster || (!custom ? poster : '')

  useEffect(() => {
    function onPaste(event) {
      const file = [...(event.clipboardData?.files || [])].find((item) => item.type.startsWith('image/'))
      if (file) onSelectFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onSelectFile])

  function takeFile(list) {
    const file = list?.[0]
    if (file?.type.startsWith('image/')) onSelectFile(file)
  }

  return (
    <div className="thumb-picker">
      <div className="credit-banner">
        <div>
          <div className="credit-banner-title">Use a clean still from the film</div>
          <div className="credit-banner-copy">
            Pick a frame that looks good as a poster. Skip title cards, credits, and burned-in
            subtitles — they get noisy when the thumbnail is small.
          </div>
        </div>
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
      <div className="thumb-choice">
        <button
          type="button"
          className={`thumb-slot${!custom ? ' is-on' : ''}`}
          onClick={onReset}
        >
          <span className="thumb-slot-frame">
            {defaultPoster ? (
              <img src={defaultPoster} alt="" />
            ) : (
              <span className="thumb-preview-empty">No thumbnail yet</span>
            )}
          </span>
          <span className="field-label">Default</span>
        </button>
        <button
          type="button"
          className={`thumb-slot thumb-slot-upload${custom ? ' is-on' : ''}${dragging ? ' is-drag' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            takeFile(event.dataTransfer.files)
          }}
        >
          <span className="thumb-slot-frame">
            {custom && poster ? (
              <img src={poster} alt="" />
            ) : (
              <span className="thumb-upload-copy">
                <Icon name="add-image" />
                <span>Drop an image or click to upload</span>
              </span>
            )}
          </span>
          <span className="field-label">Your image</span>
        </button>
      </div>
    </div>
  )
}
