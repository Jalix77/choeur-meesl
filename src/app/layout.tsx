import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chœur de Louange — MEESL',
  description: 'Espace privé du Chœur de Louange de la Mission Église Évangélique Sel et Lumière',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FBF6EC] text-[#5A3318]">
        {children}
      </body>
    </html>
  );
}
