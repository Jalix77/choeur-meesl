import Image from 'next/image'

export default function MEESLHeader() {
  return (
    <header className="text-center border-b-2 border-[#E2B36A] pb-4 mb-6">
      <div className="flex justify-center mb-3">
        <Image src="/logo-meesl.png" alt="MEESL Logo" width={64} height={64} className="object-contain" />
      </div>
      <h1 className="font-cinzel text-xl font-bold text-[#5A3318] tracking-wide">
        Mission Église Évangélique Sel et Lumière
      </h1>
      <p className="font-cormorant italic text-[#B87333] text-base mt-0.5">
        Prêcher, instruire et desservir la communauté !
      </p>
      <div className="mt-2 inline-block px-4 py-0.5 bg-[#B87333] rounded">
        <span className="font-cinzel text-white text-xs tracking-widest">CHŒUR DE LOUANGE</span>
      </div>
    </header>
  )
}
