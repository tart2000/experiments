import { useEffect, useState } from 'react'

// Mini routeur History API : "/" = accueil, "/<id>" = une expérience.
export function navigate(path: string) {
  if (path === location.pathname) return
  history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path.replace(/\/+$/, '') || '/'
}
