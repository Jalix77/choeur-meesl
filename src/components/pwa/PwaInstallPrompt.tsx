'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'

const DISMISS_KEY = 'meesl_pwa_prompt_dismissed_at'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const SHOW_DELAY_MS = 2500

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Variant = 'android' | 'ios'

function isStandalone(): boolean {
  const standaloneNav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || standaloneNav.standalone === true
}

function isIos(): boolean {
  const ua = window.navigator.userAgent
  const isIosDevice = /iphone|ipad|ipod/i.test(ua)
  const isIpadOs = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1
  return isIosDevice || isIpadOs
}

function isSafari(): boolean {
  const ua = window.navigator.userAgent
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
}

function readDismissedAt(): number | null {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

function writeDismissedAt(timestamp: number) {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(timestamp))
  } catch {
    // stockage indisponible (navigation privée, quota…) — on ignore silencieusement
  }
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    setVisible(false)
    writeDismissedAt(Date.now())
  }, [])

  useEffect(() => {
    if (isStandalone()) return

    const dismissedAt = readDismissedAt()
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return

    let showTimer: ReturnType<typeof setTimeout> | undefined

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVariant('android')
      showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    }

    const handleAppInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      writeDismissedAt(Date.now())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (isIos() && isSafari()) {
      showTimer = setTimeout(() => {
        setVariant('ios')
        setVisible(true)
      }, SHOW_DELAY_MS)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (showTimer) clearTimeout(showTimer)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, dismiss])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    if (outcome !== 'accepted') writeDismissedAt(Date.now())
  }

  if (!visible || !variant) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
      className="no-print fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="rounded-xl border border-[#E2B36A]/50 bg-[#FBF6EC] shadow-lg shadow-black/10 p-4">
        <div className="flex items-start gap-3">
          <Image
            src="/logo-choeur-meesl.png"
            alt=""
            width={40}
            height={43}
            className="object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 id="pwa-install-title" className="font-cinzel text-sm font-bold text-[#5A3318]">
              Installer le Chœur MEESL
            </h2>
            {variant === 'android' ? (
              <p id="pwa-install-desc" className="font-spectral text-xs text-[#7A4A20] mt-1 leading-relaxed">
                Ajoutez l&apos;application à votre écran d&apos;accueil pour un accès rapide au planning, aux chants et aux annonces.
              </p>
            ) : (
              <p id="pwa-install-desc" className="font-spectral text-xs text-[#7A4A20] mt-1 leading-relaxed">
                Appuyez sur <span className="font-semibold">Partager</span> puis sur{' '}
                <span className="font-semibold">Sur l&apos;écran d&apos;accueil</span>.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 text-xs font-medium text-[#7A4A20] hover:text-[#5A3318] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333]"
          >
            Plus tard
          </button>
          {variant === 'android' ? (
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B87333] hover:bg-[#9C3D6E] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] transition-colors"
            >
              Installer
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B87333] hover:bg-[#9C3D6E] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] transition-colors"
            >
              Compris
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
