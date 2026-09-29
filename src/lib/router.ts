import { useEffect, useState } from 'react'

// Mini routeur History API : "/" = accueil, "/<id>" = une expérience.
// Les chemins sont relatifs à la base de l'app (ex. /experiments/ sur GitHub Pages).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export const href = (path: string) => BASE + path

const current = () => {
  const p = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : location.pathname
  return p.replace(/\/+$/, '') || '/'
}

export function navigate(path: string) {
  if (path === current()) return
  history.pushState(null, '', href(path))
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePath() {
  const [path, setPath] = useState(current)
  useEffect(() => {
    const onPop = () => setPath(current())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
