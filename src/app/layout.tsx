import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chœur de Louange MEESL',
  description: 'Plateforme interne du Chœur de Louange — Mission Église Évangélique Sel et Lumière',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#FBF6EC]">{children}</body>
    </html>
  )
}
