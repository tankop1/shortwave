export function parseVideoUrl(raw) {
  const value = raw.trim()
  if (!value) return null

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? { host: 'youtube', id, url: `https://youtu.be/${id}` } : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1)
      if (id && id !== 'watch' && id !== 'embed' && id !== 'shorts') {
        return { host: 'youtube', id, url: `https://www.youtube.com/watch?v=${id}` }
      }
      const parts = url.pathname.split('/').filter(Boolean)
      const nested = parts[0] === 'embed' || parts[0] === 'shorts' ? parts[1] : null
      return nested ? { host: 'youtube', id: nested, url: `https://www.youtube.com/watch?v=${nested}` } : null
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part))
      return id ? { host: 'vimeo', id, url: `https://vimeo.com/${id}` } : null
    }
  } catch {
    return null
  }

  return null
}

export function youtubePoster(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export function embedUrl(film, { autoplay = true, mute = false, loop = false } = {}) {
  if (film.host === 'youtube' && film.videoId) {
    const params = ['rel=0']
    if (autoplay) params.push('autoplay=1')
    if (mute) params.push('mute=1')
    if (loop) params.push(`loop=1`, `playlist=${film.videoId}`)
    return `https://www.youtube.com/embed/${film.videoId}?${params.join('&')}`
  }
  if (film.host === 'vimeo' && film.videoId) {
    const params = []
    if (autoplay) params.push('autoplay=1')
    if (mute) params.push('muted=1')
    if (loop) params.push('loop=1')
    return `https://player.vimeo.com/video/${film.videoId}${params.length ? `?${params.join('&')}` : ''}`
  }
  return null
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function fetchVideoMeta(url) {
  const parsed = parseVideoUrl(url)
  if (!parsed) throw new Error('Paste a YouTube or Vimeo link.')

  if (parsed.host === 'youtube') {
    return {
      ...parsed,
      poster: youtubePoster(parsed.id),
      title: '',
      durationLabel: '',
    }
  }

  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsed.url)}`
  const response = await fetch(endpoint)
  if (!response.ok) throw new Error('Couldn’t find that Vimeo video.')
  const data = await response.json()
  return {
    ...parsed,
    poster: data.thumbnail_url || '',
    title: data.title || '',
    durationLabel: formatDuration(data.duration),
  }
}
