export default function Footer() {
  return (
    <footer className="bg-[#5A3318] text-[#FBF6EC]/70 text-xs py-3 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-x-4 gap-y-1 justify-center text-center font-cormorant">
        <span>4, Delmas 48 · Port-au-Prince, Haïti</span>
        <span className="hidden sm:inline">·</span>
        <a href="mailto:meesl1410@gmail.com" className="hover:text-[#E2B36A] transition-colors">meesl1410@gmail.com</a>
        <span className="hidden sm:inline">·</span>
        <span>(509) 37 97 1717</span>
        <span className="hidden sm:inline">·</span>
        <span>(509) 33 16 6621</span>
      </div>
    </footer>
  );
}
