'use client'

import { useState, useEffect, useRef } from 'react'
import { parseSong, transposeSong, type Notation } from '@/lib/chords'
import type { Song } from '@/lib/database.types'

interface SongSheetProps {
  song: Song
  initialTranspose?: number
  printMode?: boolean
}

function sectionBadge(label: string): React.CSSProperties {
  const l = label.toLowerCase()
  if (l.includes('refrain') || l.includes('chorus'))
    return { background: '#9C3D6E', color: '#fff' }
  if (l.includes('pont') || l.includes('bridge'))
    return { background: '#8A5A2B', color: '#fff' }
  return { background: '#B87333', color: '#fff' }
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: "'Cinzel', serif",
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  padding: '3px 12px',
  borderRadius: 4,
  marginBottom: 8,
}

const SYL_BASE: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  whiteSpace: 'pre',
  color: '#3C2410',
  fontFamily: "'Spectral', Georgia, serif",
  fontWeight: 500,
}

const CRD_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '-1.35em',
  left: 0,
  whiteSpace: 'nowrap',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.76em',
  fontWeight: 700,
  color: '#9C3D6E',
}

export default function SongSheet({ song, initialTranspose = 0, printMode = false }: SongSheetProps) {
  const [semitones, setSemitones] = useState(initialTranspose)
  const [notation, setNotation]   = useState<Notation>(song.notation ?? 'latin')
  const [fontSize, setFontSize]   = useState(16)
  const bodyRef = useRef<HTMLDivElement>(null)

  const parsed    = parseSong(song.body)
  const displayed = transposeSong(parsed, semitones, notation)

  // Widen each syllable span if its chord is wider
  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.querySelectorAll<HTMLSpanElement>('[data-syl]').forEach(syl => {
      const crd = syl.querySelector<HTMLSpanElement>('[data-crd]')
      if (!crd) return
      syl.style.paddingRight = '0px'
      const need = crd.offsetWidth + 6
      const have = syl.offsetWidth
      if (need > have) syl.style.paddingRight = (need - have) + 'px'
    })
  })

  // Two-column body — sections can flow across columns; individual lines cannot break
  const bodyStyle: React.CSSProperties = {
    fontSize,
    columnCount: 2,
    columnGap: '42px',
    columnRuleWidth: 1,
    columnRuleStyle: 'solid',
    columnRuleColor: '#D9C49B',
  }

  // A lyric line (with or without chords) must not split across columns
  const lyricLineStyle: React.CSSProperties = {
    margin: '0 0 3px',
    lineHeight: 2.55,
    fontFamily: "'Spectral', Georgia, serif",
    color: '#3C2410',
    breakInside: 'avoid',
  }

  // Section wrapper: NO breakInside avoid — sections CAN split so content fills both columns
  const sectionStyle: React.CSSProperties = {
    marginBottom: 18,
  }

  // Label row (badge + following lines) should stay together
  const labelBlockStyle: React.CSSProperties = {
    breakInside: 'avoid',
    display: 'inline-block',
    width: '100%',
  }

  return (
    <div>
      {/* Controls */}
      {!printMode && (
        <div className="no-print flex flex-wrap items-center gap-3 mb-5 p-3 bg-[#E2B36A]/20 border border-[#E2B36A]/50 rounded-xl">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Transposer</span>
            <button onClick={() => setSemitones(s => s - 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">-</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{semitones > 0 ? `+${semitones}` : semitones}</span>
            <button onClick={() => setSemitones(s => s + 1)} className="w-7 h-7 rounded bg-[#B87333] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#5A3318] mr-1">Taille</span>
            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">-</button>
            <span className="w-8 text-center text-sm font-mono text-[#5A3318]">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(26, s + 1))} className="w-7 h-7 rounded bg-[#7A4A20] text-white font-bold hover:bg-[#5A3318]">+</button>
          </div>
          <button
            onClick={() => setNotation(n => n === 'latin' ? 'anglo' : 'latin')}
            className="px-3 py-1 rounded border border-[#B87333] text-[#B87333] text-xs font-semibold hover:bg-[#B87333] hover:text-white transition-colors"
          >
            {notation === 'latin' ? 'Do Re Mi -> C D E' : 'C D E -> Do Re Mi'}
          </button>
          {semitones !== 0 && (
            <button onClick={() => setSemitones(0)} className="text-xs text-[#9C3D6E] hover:underline">
              Reinitialiser
            </button>
          )}
        </div>
      )}

      {/* Meta */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#7a6244', display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 4 }}>
        {song.key_signature && <span><b style={{ color: '#8A5A2B' }}>Tonalite : </b>{song.key_signature}{semitones !== 0 ? ` (${semitones > 0 ? '+' : ''}${semitones})` : ''}</span>}
        {song.tempo         && <span><b style={{ color: '#8A5A2B' }}>Tempo : </b>{song.tempo} bpm</span>}
        {song.time_signature && <span><b style={{ color: '#8A5A2B' }}>Mesure : </b>{song.time_signature}</span>}
        {song.author        && <span><b style={{ color: '#8A5A2B' }}>Source : </b>{song.author}</span>}
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg,#B87333,transparent)', margin: '6px 0 18px' }} />

      {/* Two-column body */}
      <div ref={bodyRef} style={bodyStyle}>
        {displayed.sections.map((section, si) => (
          <div key={si} style={sectionStyle}>
            {/* Badge + first few lines kept together */}
            {section.label && (
              <div style={labelBlockStyle}>
                <div style={{ breakInside: 'avoid' }}>
                  <span style={{ ...BADGE_BASE, ...sectionBadge(section.label) }}>
                    {section.label}
                  </span>
                </div>
              </div>
            )}
            {section.lines.map((line, li) => {
              // Empty line
              if (!line.hasChords && line.tokens.every(t => !t.lyric.trim())) {
                return <div key={li} style={{ ...lyricLineStyle, lineHeight: 1 }}>&nbsp;</div>
              }
              // Plain line
              if (!line.hasChords) {
                return (
                  <div key={li} style={lyricLineStyle}>
                    <span style={{ whiteSpace: 'pre', fontFamily: "'Spectral', Georgia, serif", color: '#3C2410', fontWeight: 500 }}>
                      {line.tokens.map(t => t.lyric).join('')}
                    </span>
                  </div>
                )
              }
              // Line with chords — each line is atomic (no column-break inside)
              return (
                <div key={li} style={lyricLineStyle}>
                  {line.tokens.map((token, ti) => {
                    if (!token.chord) {
                      return token.lyric
                        ? <span key={ti} style={{ whiteSpace: 'pre', fontFamily: "'Spectral', Georgia, serif", color: '#3C2410', fontWeight: 500 }}>{token.lyric}</span>
                        : null
                    }
                    return (
                      <span key={ti} data-syl style={SYL_BASE}>
                        <span data-crd style={CRD_STYLE}>{token.chord}</span>
                        {token.lyric === '' ? ' ' : token.lyric}
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
          <strong className="not-italic font-semibold">Notes : </strong>{song.notes}
        </div>
      )}
    </div>
  )
}
