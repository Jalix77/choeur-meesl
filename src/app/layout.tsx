import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chœur de Louange MEESL',
  description: 'Plateforme interne du Chœur de Louange — Mission Église Évangélique Sel et Lumière',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MEESL Chœur',
  },
}

export const viewport: Viewport = {
  themeColor: '#B87333',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#FBF6EC]">
        {/*
          Capture `beforeinstallprompt` avant l'hydratation React : sur une visite où le
          service worker est déjà actif, Chrome peut déclencher l'événement avant que le
          composant PwaInstallPrompt ait fini de monter et d'attacher son écouteur. Ce
          script s'exécute plus tôt (beforeInteractive) et relaie l'événement capturé.
        */}
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`
            window.__meeslDeferredInstallPrompt = null;
            window.addEventListener('beforeinstallprompt', function (e) {
              e.preventDefault();
              window.__meeslDeferredInstallPrompt = e;
              window.dispatchEvent(new Event('meesl:beforeinstallprompt'));
            });
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
