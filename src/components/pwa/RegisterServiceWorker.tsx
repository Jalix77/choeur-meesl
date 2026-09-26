'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // installation impossible (navigation privée, navigateur non supporté…) — non bloquant
    })
  }, [])

  return null
}
