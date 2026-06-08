'use client';

import { useState, useRef, useEffect } from 'react';
import {
  parseSong,
  transposeSong,
  sectionColor,
  type Notation,
  type ParsedSong,
} from '@/lib/chords';

interface SongSheetProps {
  body: string;
  defaultNotation: Notation;
  defaultTranspose?: number;
  printMode?: boolean;
}

interface RenderedToken {
  chord: string;
  lyric: string;
  minWidth: number;
}

function TokenCell({ chord, lyric }: { chord: string; lyric: string }) {
  const chordRef = useRef<HTMLSpanElement>(null);
  const lyricRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (chordRef.current && lyricRef.current) {
      const cw = chordRef.current.getBoundingClientRect().width;
      const lw = lyricRef.current.getBoundingClientRect().width;
      setWidth(Math.max(cw, lw) + 4);
    }
  }, [chord, lyric]);

  return (
    <span
      className="inline-flex flex-col items-start"
      style={width ? { minWidth: width } : undefined}
    >
      <span
        ref={chordRef}
        className="font-mono-chord font-bold text-[#9C3D6E] text-sm leading-none whitespace-nowrap"
      >
        {chord || ' '}
      </span>
      <span
        ref={lyricRef}
        className="font-spectral text-[#5A3318] leading-snug whitespace-pre"
      >
        {lyric || ' '}
      </span>
    </span>
  );
}

export default function SongSheet({
  body,
  defaultNotation,
  defaultTranspose = 0,
  printMode = false,
}: SongSheetProps) {
  const [semitones, setSemitones] = useState(defaultTranspose);
  const [notation, setNotation] = useState<Notation>(defaultNotation);
  const [fontSize, setFontSize] = useState(16);

  const parsed: ParsedSong = parseSong(body);
  const transposed = transposeSong(parsed, semitones, notation);

  const sections = transposed.sections;

  // Split into two columns
  const half = Math.ceil(sections.length / 2);
  const col1 = sections.slice(0, half);
  const col2 = sections.slice(half);

  return (
    <div style={{ fontSize }}>
      {/* Controls — hidden on print */}
      {!printMode && (
        <div className="no-print flex flex-wrap items-center gap-3 mb-6 bg-white/40 border border-[#E2B36A]/40 rounded-xl px-4 py-3">
          {/* Transpose */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-cinzel uppercase tracking-widest text-[#B87333]">Transposer</span>
            <button
              onClick={() => setSemitones(s => s - 1)}
              className="w-7 h-7 rounded border border-[#E2B36A] text-[#5A3318] hover:bg-[#E2B36A]/30 font-bold text-lg leading-none"
            >−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <button
              onClick={() => setSemitones(s => s + 1)}
              className="w-7 h-7 rounded border border-[#E2B36A] text-[#5A3318] hover:bg-[#E2B36A]/30 font-bold text-lg leading-none"
            >+</button>
          </div>

          <div className="h-5 w-px bg-[#E2B36A]/40" />

          {/* Text size */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-cinzel uppercase tracking-widest text-[#B87333]">Taille</span>
            <button
              onClick={() => setFontSize(s => Math.max(10, s - 2))}
              className="w-7 h-7 rounded border border-[#E2B36A] text-[#5A3318] hover:bg-[#E2B36A]/30 font-bold text-lg leading-none"
            >−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{fontSize}</span>
            <button
              onClick={() => setFontSize(s => Math.min(32, s + 2))}
              className="w-7 h-7 rounded border border-[#E2B36A] text-[#5A3318] hover:bg-[#E2B36A]/30 font-bold text-lg leading-none"
            >+</button>
          </div>

          <div className="h-5 w-px bg-[#E2B36A]/40" />

          {/* Notation toggle */}
          <button
            onClick={() => setNotation(n => n === 'latin' ? 'anglo' : 'latin')}
            className="text-xs font-cinzel uppercase tracking-widest text-[#B87333] hover:text-[#5A3318] border border-[#E2B36A]/60 rounded px-2.5 py-1 transition-colors"
          >
            {notation === 'latin' ? 'Do Ré Mi → C D E' : 'C D E → Do Ré Mi'}
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[col1, col2].map((col, ci) => (
          <div key={ci} className="space-y-6">
            {col.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className={`font-cinzel text-xs uppercase tracking-widest font-semibold mb-1 ${sectionColor(section.label)}`}>
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.lines.map((line, li) => {
                    if (!line.hasChords && line.tokens.every(t => !t.lyric.trim())) {
                      return <div key={li} className="h-2" />;
                    }
                    if (!line.hasChords) {
                      return (
                        <p key={li} className="font-spectral text-[#5A3318] leading-snug">
                          {line.tokens.map(t => t.lyric).join('')}
                        </p>
                      );
                    }
                    return (
                      <div key={li} className="flex flex-wrap">
                        {line.tokens.map((token, ti) => (
                          <TokenCell key={ti} chord={token.chord} lyric={token.lyric} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
