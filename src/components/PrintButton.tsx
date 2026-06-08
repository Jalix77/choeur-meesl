'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[#B87333] text-white font-cinzel px-4 py-2 rounded-lg text-sm hover:bg-[#9A6128] transition-colors"
    >
      Télécharger PDF
    </button>
  );
}
