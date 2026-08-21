export const FILM_PARAM = 'film'

export function filmShareUrl(filmId) {
  const url = new URL('/', window.location.origin)
  url.searchParams.set(FILM_PARAM, filmId)
  return url.toString()
}

export function filmIdFromSearch(search) {
  return new URLSearchParams(search).get(FILM_PARAM) || null
}

export async function copyFilmLink(filmId) {
  const url = filmShareUrl(filmId)
  await navigator.clipboard.writeText(url)
  return url
}
