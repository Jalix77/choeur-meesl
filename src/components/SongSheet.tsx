'use client'

import { useState, useEffect, useRef } from 'react'
import { parseSong, transposeSong, type Notation } from '@/lib/chords'
import type { Song } from '@/lib/database.types'

interface SongSheetProps {
  song: Song
  initialTranspose?: number
  printMode?: boolean
}

// Section label -> badge style matching the HTML canevas
function sectionBadgeClass(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('refrain') || l.includes('chorus')) return 'badge-refrain'
  if (l.includes('pont') || l.includes('bridge'))    return 'badge-pont'
  return 'badge-default'
}

export default function SongSheet({ song, initialTranspose = 0, printMode = false }: SongSheetProps) {
  const [semitones, setSemitones]   = useState(initialTranspose)
  const [notation, setNotation]     = useState<Notation>(song.notation ?? 'latin')
  const [fontSize, setFontSize]     = useState(16)
  const bodyRef = useRef<HTMLDivElement>(null)

  const parsed    = parseSong(song.body)
  const displayed = transposeSong(parsed, semitones, notation)

  // After each render: adjust paddingRight on every .syl so chords never overlap
  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.querySelectorAll<HTMLSpanElement>('.syl').forEach(syl => {
      const crd = syl.querySelector<HTMLSpanElement>('.crd')
      if (!crd) return
      syl.style.paddingRight = '0px'           // reset
      const need = crd.offsetWidth + 6
      const have = syl.offsetWidth
      if (need > have) syl.style.paddingRight = (need - have) + 'px'
    })
  })

  return (
    <div>
      <style>{`
        .syl {
          position: relative;
          display: inline-block;
          white-space: pre;
          color: #3C2410;
          font-family: 'Spectral', Georgia, serif;
          font-weight: 500;
        }
        .syl .crd {
          position: absolute;
          top: -1.35em;
          left: 0;
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76em;
          font-weight: 700;
          color: #9C3D6E;
        }
        .lyric-line {
          margin: 0 0 3px;
          line-height: 2.55;
          font-family: 'Spectral', Georgia, serif;
          color: #3C2410;
          white-space: pre-wrap;
        }
        .plain-text {
          white-space: pre;
          font-family: 'Spectral', Georgia, serif;
          color: #3C2410;
          font-weight: 500;
        }
        .badge-default { background: #B87333; color: #fff; }
        .badge-refrain  { background: #9C3D6E; color: #fff; }
        .badge-pont     { background: #8A5A2B; color: #fff; }
        .section-badge {
          display: inline-block;
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 3px 12px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .song-body {
          column-count: 2;
          column-gap: 42px;
          column-rule: 1px solid #D9C49B;
        }
        @media (max-width: 620px) {
          .song-body { column-count: 1; }
        }
        @media print {
          .song-body { column-count: 2; }
        }
        .song-section {
          break-inside: avoid;
          margin-bottom: 18px;
        }
      `}</style>

      {/* Controls (hidden in print mode) */}
      {!printMode && (
        <div className="no-print flex flex-wrap items-center gap-3 mb-5 p-3 bg-[#E2B36A]/20 border border-[#E2B36A]/50 rounded-xl">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Transposer</span>
            <button onClick={() => setSemitones(s => s - 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{semitones > 0 ? `+${semitones}` : semitones}</span>
            <button onClick={() => setSemitones(s => s + 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Taille</span>
            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">−</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(26, s + 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>
          <button
            onClick={() => setNotation(n => n === 'latin' ? 'anglo' : 'latin')}
            className="px-3 py-1 rounded border border-[#B87333] text-[#B87333] text-xs font-semibold hover:bg-[#B87333] hover:text-white transition-colors"
          >
            {notation === 'latin' ? 'Do Ré Mi → C D E' : 'C D E → Do Ré Mi'}
          </button>
          {semitones !== 0 && (
            <button onClick={() => setSemitones(0)} className="text-xs text-[#9C3D6E] hover:underline">
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Song meta tags */}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: '#7a6244' }}>
        {song.key_signature && <span><b style={{ color: '#8A5A2B' }}>Tonalité&nbsp;:</b> {song.key_signature}{semitones !== 0 ? ` (${semitones > 0 ? '+' : ''}${semitones})` : ''}</span>}
        {song.tempo         && <span><b style={{ color: '#8A5A2B' }}>Tempo&nbsp;:</b> {song.tempo} bpm</span>}
        {song.time_signature && <span><b style={{ color: '#8A5A2B' }}>Mesure&nbsp;:</b> {song.time_signature}</span>}
        {song.author        && <span><b style={{ color: '#8A5A2B' }}>Source&nbsp;:</b> {song.author}</span>}
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg,#B87333,transparent)', margin: '6px 0 18px' }} />

      {/* Body — two columns, exact replica of the HTML canevas */}
      <div className="song-body" style={{ fontSize: `${fontSize}px` }} ref={bodyRef}>
        {displayed.sections.map((section, si) => (
          <div key={si} className="song-section">
            {section.label && (
              <span className={`section-badge ${sectionBadgeClass(section.label)}`}>
                {section.label}
              </span>
            )}
            {section.lines.map((line, li) => {
              // Empty line
              if (!line.hasChords && line.tokens.every(t => !t.lyric.trim())) {
                return <div key={li} className="lyric-line">&nbsp;</div>
              }
              // Plain line (no chords)
              if (!line.hasChords) {
                return (
                  <div key={li} className="lyric-line">
                    <span className="plain-text">{line.tokens.map(t => t.lyric).join('')}</span>
                  </div>
                )
              }
              // Line with chords — exact .syl / .crd technique from HTML
              return (
                <div key={li} className="lyric-line">
                  {line.tokens.map((token, ti) => {
                    if (!token.chord) {
                      // Leading text before first chord
                      return token.lyric
                        ? <span key={ti} className="plain-text">{token.lyric}</span>
                        : null
                    }
                    // Syllable with chord above
                    const syllable = token.lyric === '' ? ' ' : token.lyric
                    return (
                      <span key={ti} className="syl">
                        <span className="crd">{token.chord}</span>
                        {syllable}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {song.notes && (
        <div className="mt-4 p-3 border-l-2 border-[#E2B36A] bg-[#E2B36A]/10 rounded-r text-sm text-[#7A4A20] italic">
          <strong className="not-italic font-semibold">Notes&nbsp;:</strong> {song.notes}
        </div>
      )}
    </div>
  )
}
