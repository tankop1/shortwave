import { useState } from 'react'

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="star-icon">
      <path d="M12 2.6 14.9 8.5l6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.5l1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z" />
    </svg>
  )
}

function starFill(value, n) {
  return Math.min(1, Math.max(0, Number(value) - (n - 1)))
}

function Star({ fill }) {
  return (
    <span className={`star${fill >= 1 ? ' is-on' : fill > 0 ? ' is-partial' : ''}`}>
      <StarIcon />
      {fill > 0 && fill < 1 ? (
        <span className="star-clip" style={{ width: `${fill * 100}%` }}>
          <StarIcon />
        </span>
      ) : null}
    </span>
  )
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const stars = [1, 2, 3, 4, 5]

  return (
    <div
      className={`star-rating star-rating-${size}${readOnly ? ' is-static' : ''}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label="Star rating"
      onMouseLeave={() => setHover(0)}
    >
      {stars.map((n) => {
        const fill = hover ? (hover >= n ? 1 : 0) : starFill(shown, n)
        if (readOnly) {
          return <Star key={n} fill={fill} />
        }
        return (
          <button
            key={n}
            type="button"
            className="star-hit"
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            aria-checked={value === n}
            role="radio"
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onChange?.(n)}
          >
            <Star fill={fill} />
          </button>
        )
      })}
    </div>
  )
}
