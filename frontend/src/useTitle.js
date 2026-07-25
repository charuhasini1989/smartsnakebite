import { useEffect } from 'react'

export function useTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} | SmartSnakebite`
      : 'SmartSnakebite — Voice First-Aid & Emergency Routing'
  }, [title])
}
