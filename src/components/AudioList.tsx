interface AudioFile {
  id: string;
  label: string;
  kind: string;
  signedUrl: string;
}

export default function AudioList({ files }: { files: AudioFile[] }) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#B87333]">Fichiers audio</h3>
      {files.map(f => (
        <div key={f.id} className="bg-white/40 border border-[#E2B36A]/40 rounded-lg p-3">
          <p className="text-sm font-medium text-[#5A3318] mb-2">{f.label}</p>
          <audio controls src={f.signedUrl} className="w-full h-8 accent-[#B87333]" />
        </div>
      ))}
    </div>
  );
}
