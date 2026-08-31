'use client'

export function PrintProgramButton() {
  return (
    <div className="no-print fixed top-4 right-4 z-10 flex gap-2">
      <a
        href="/planning"
        className="bg-white border border-[#E2B36A] text-[#B87333] px-3 py-2 rounded-lg shadow text-sm hover:bg-[#FBF6EC] transition-colors"
      >
        ← Retour
      </a>
      <button
        onClick={() => window.print()}
        className="bg-[#B87333] text-white px-4 py-2 rounded-lg shadow font-cinzel text-sm hover:bg-[#5A3318] transition-colors"
      >
        Télécharger PDF
      </button>
    </div>
  )
}
