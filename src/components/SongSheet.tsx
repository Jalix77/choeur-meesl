'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { parseSong, transposeSong, sectionColor, type Notation } from '@/lib/chords'
import type { Song } from '@/lib/database.types'

interface SongSheetProps {
  song: Song
  initialTranspose?: number
  printMode?: boolean
}

export default function SongSheet({ song, initialTranspose = 0, printMode = false }: SongSheetProps) {
  const [semitones, setSemitones] = useState(initialTranspose)
  const [notation, setNotation] = useState<Notation>(song.notation ?? 'latin')
  const [fontSize, setFontSize] = useState(14)

  const parsed = parseSong(song.body)
  const transposed = transposeSong(parsed, semitones, notation)

  return (
    <div className="song-sheet">
      {/* Controls (hidden in print mode) */}
      {!printMode && (
        <div className="no-print flex flex-wrap items-center gap-3 mb-5 p-3 bg-[#E2B36A]/20 border border-[#E2B36A]/50 rounded-xl">
          {/* Transpose */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Transposer</span>
            <button onClick={() => setSemitones(s => s - 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{semitones > 0 ? `+${semitones}` : semitones}</span>
            <button onClick={() => setSemitones(s => s + 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Taille</span>
            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>

          {/* Notation toggle */}
          <button
            onClick={() => setNotation(n => n === 'latin' ? 'anglo' : 'latin')}
            className="px-3 py-1 rounded border border-[#B87333] text-[#B87333] text-xs font-semibold hover:bg-[#B87333] hover:text-white transition-colors"
          >
            {notation === 'latin' ? 'Do Ré Mi → C D E' : 'C D E → Do Ré Mi'}
          </button>

          {/* Reset */}
          {semitones !== 0 && (
            <button onClick={() => setSemitones(0)} className="text-xs text-[#9C3D6E] hover:underline">
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Song meta */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {song.key_signature && (
          <span className="text-[#B87333]">
            <strong>Tonalité :</strong> {song.key_signature}
            {semitones !== 0 && <span className="ml-1 text-xs text-[#9C3D6E]">(+{semitones} ½ tons)</span>}
          </span>
        )}
        {song.tempo && <span className="text-[#7A4A20]"><strong>Tempo :</strong> ♩ {song.tempo} bpm</span>}
        {song.time_signature && <span className="text-[#7A4A20]"><strong>Mesure :</strong> {song.time_signature}</span>}
        {song.author && <span className="text-[#7A4A20]"><strong>Source :</strong> {song.author}</span>}
      </div>

      {/* Sections in two columns */}
      <div className="columns-1 md:columns-2 gap-6" style={{ fontSize: `${fontSize}px` }}>
        {transposed.sections.map((section, si) => (
          <div key={si} className="break-inside-avoid mb-5">
            {section.label && (
              <h3 className={`font-cinzel font-bold text-sm mb-2 uppercase tracking-wide ${sectionColor(section.label)}`}>
                {section.label}
              </h3>
            )}
            {section.lines.map((line, li) => (
              <SongLine key={li} tokens={line.tokens} hasChords={line.hasChords} />
            ))}
          </div>
        ))}
      </div>

      {song.notes && (
        <div className="mt-4 p-3 border-l-2 border-[#E2B36A] bg-[#E2B36A]/10 rounded-r text-sm text-[#7A4A20] italic">
          <strong className="not-italic font-semibold">Notes :</strong> {song.notes}
        </div>
      )}
    </div>
  )
}

interface Token { chord: string; lyric: string }

function SongLine({ tokens, hasChords }: { tokens: Token[]; hasChords: boolean }) {
  const lineRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useState(0)

  // After mount, measure chord widths and expand syllable min-widths
  useEffect(() => {
    forceUpdate(n => n + 1)
  }, [tokens])

  if (!hasChords) {
    return (
      <div className="leading-relaxed text-[#5A3318] font-spectral min-h-[1.2em]">
        {tokens.map((t, i) => t.lyric || (i === 0 ? ' ' : ''))}
      </div>
    )
  }

  return (
    <div ref={lineRef} className="mb-1">
      {/* Chord row */}
      <div className="flex flex-wrap leading-none mb-0.5">
        {tokens.map((token, i) =>
          token.chord ? (
            <ChordSyllable key={i} chord={token.chord} lyric={token.lyric} />
          ) : token.lyric ? (
            <span key={i} className="text-[#5A3318] font-spectral whitespace-pre">{token.lyric}</span>
          ) : null
        )}
      </div>
    </div>
  )
}

function ChordSyllable({ chord, lyric }: { chord: string; lyric: string }) {
  const chordRef = useRef<HTMLSpanElement>(null)
  const lyricRef = useRef<HTMLSpanElement>(null)
  const [minWidth, setMinWidth] = useState(0)

  useEffect(() => {
    if (chordRef.current && lyricRef.current) {
      const cw = chordRef.current.getBoundingClientRect().width
      const lw = lyricRef.current.getBoundingClientRect().width
      if (cw > lw) setMinWidth(cw + 4)
    }
  }, [chord, lyric])

  return (
    <span className="inline-flex flex-col" style={{ minWidth: minWidth || undefined }}>
      <span ref={chordRef} className="font-mono-chords font-bold text-[#9C3D6E] text-[0.8em] leading-tight whitespace-nowrap">
        {chord}
      </span>
      <span ref={lyricRef} className="text-[#5A3318] font-spectral leading-relaxed whitespace-pre">
        {lyric || ' '}
      </span>
    </span>
  )
}
