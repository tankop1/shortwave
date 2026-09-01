export const FILM_PARAM = 'film'
export const SIGNUP_PARAM = 'signup'
export const MESSAGE_PARAM = 'message'
export const UPLOAD_PARAM = 'upload'

export function filmShareUrl(filmId) {
  const url = new URL('/', window.location.origin)
  url.searchParams.set(FILM_PARAM, filmId)
  return url.toString()
}

export function filmIdFromSearch(search) {
  return new URLSearchParams(search).get(FILM_PARAM) || null
}

export function wantsSignup(search) {
  const value = new URLSearchParams(search).get(SIGNUP_PARAM)
  return value === '1' || value === 'true'
}

export function messageIdFromSearch(search) {
  return new URLSearchParams(search).get(MESSAGE_PARAM) || null
}

export function wantsUpload(search) {
  const value = new URLSearchParams(search).get(UPLOAD_PARAM)
  return value === '1' || value === 'true'
}

export async function copyFilmLink(filmId) {
  const url = filmShareUrl(filmId)
  await navigator.clipboard.writeText(url)
  return url
}
