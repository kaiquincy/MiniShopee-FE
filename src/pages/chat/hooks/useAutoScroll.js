import { useEffect, useRef } from 'react'

export function useAutoScroll(deps = []) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollTo({
      top: endRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, deps)
  return endRef
}
