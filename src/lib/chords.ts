// Chord parsing, transposition, and rendering utilities for MEESL Choir app

export type Notation = 'latin' | 'anglo';

const CHROMATIC_ANGLO = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_LATIN = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

const FLAT_ANGLO = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_LATIN = ['Do', 'Réb', 'Ré', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

// Map note names to chromatic index
function noteIndex(note: string): number {
  // Try sharp lists first, then flat
  let idx = CHROMATIC_ANGLO.findIndex(n => n.toLowerCase() === note.toLowerCase());
  if (idx >= 0) return idx;
  idx = CHROMATIC_LATIN.findIndex(n => n.toLowerCase() === note.toLowerCase());
  if (idx >= 0) return idx;
  idx = FLAT_ANGLO.findIndex(n => n.toLowerCase() === note.toLowerCase());
  if (idx >= 0) return idx;
  idx = FLAT_LATIN.findIndex(n => n.toLowerCase() === note.toLowerCase());
  if (idx >= 0) return idx;
  return -1;
}

// Regex to match a root note (latin or anglo, with accidentals)
const NOTE_PATTERN =
  /^(Do#|Réb|Ré#|Mib|Fa#|Solb|Sol#|Lab|La#|Sib|Do|Ré|Mi|Fa|Sol|La|Si|C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|[A-G])/i;

export function transposeNote(note: string, semitones: number, notation: Notation): string {
  const match = note.match(NOTE_PATTERN);
  if (!match) return note;

  const root = match[1];
  const suffix = note.slice(root.length);
  const idx = noteIndex(root);
  if (idx < 0) return note;

  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  const useFlat = root.toLowerCase().includes('b') || root.toLowerCase().includes('éb') || root.toLowerCase().includes('ib');

  let newRoot: string;
  if (notation === 'latin') {
    newRoot = useFlat ? FLAT_LATIN[newIdx] : CHROMATIC_LATIN[newIdx];
  } else {
    newRoot = useFlat ? FLAT_ANGLO[newIdx] : CHROMATIC_ANGLO[newIdx];
  }

  return newRoot + suffix;
}

export function transposeChord(chord: string, semitones: number, notation: Notation): string {
  if (semitones === 0 && notation === 'latin') {
    // still convert notation
  }
  // Handle bass note (e.g. G/B)
  const slashIdx = chord.indexOf('/');
  if (slashIdx > 0) {
    const main = chord.slice(0, slashIdx);
    const bass = chord.slice(slashIdx + 1);
    return transposeChord(main, semitones, notation) + '/' + transposeNote(bass, semitones, notation);
  }
  return transposeNote(chord, semitones, notation);
}

// ─── Song body parsing ───────────────────────────────────────────────────────
// Format:
//   # Section label      → new section
//   [Chord]lyrics ...    → chord token before syllable
//   Plain text line      → lyrics without chords

export interface ChordToken {
  chord: string;
  lyric: string; // text that follows until next chord or end of line
}

export interface SongLine {
  tokens: ChordToken[];
  hasChords: boolean;
}

export interface SongSection {
  label: string;
  lines: SongLine[];
}

export interface ParsedSong {
  sections: SongSection[];
}

function parseLine(raw: string): SongLine {
  const tokens: ChordToken[] = [];
  // Match [Chord] followed by text
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let hasChords = false;

  // leading text before first chord
  const firstBracket = raw.indexOf('[');
  if (firstBracket > 0) {
    tokens.push({ chord: '', lyric: raw.slice(0, firstBracket) });
  } else if (firstBracket === -1) {
    return { tokens: [{ chord: '', lyric: raw }], hasChords: false };
  }

  while ((match = regex.exec(raw)) !== null) {
    hasChords = true;
    tokens.push({ chord: match[1], lyric: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    tokens.push({ chord: '', lyric: raw.slice(lastIndex) });
  }

  return { tokens, hasChords };
}

export function parseSong(body: string): ParsedSong {
  const lines = body.split('\n');
  const sections: SongSection[] = [];
  let current: SongSection = { label: '', lines: [] };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('#')) {
      if (current.lines.length > 0 || current.label) {
        sections.push(current);
      }
      current = { label: trimmed.replace(/^#+\s*/, ''), lines: [] };
    } else if (trimmed === '') {
      // blank line → separator, kept as empty
      current.lines.push({ tokens: [{ chord: '', lyric: '' }], hasChords: false });
    } else {
      current.lines.push(parseLine(raw));
    }
  }
  if (current.lines.length > 0 || current.label) {
    sections.push(current);
  }

  return { sections };
}

export function transposeSong(song: ParsedSong, semitones: number, notation: Notation): ParsedSong {
  return {
    sections: song.sections.map(section => ({
      ...section,
      lines: section.lines.map(line => ({
        ...line,
        tokens: line.tokens.map(token => ({
          ...token,
          chord: token.chord ? transposeChord(token.chord, semitones, notation) : '',
        })),
      })),
    })),
  };
}

// Convert all chord notation in a parsed song (no transposition, just notation change)
export function convertNotation(song: ParsedSong, notation: Notation): ParsedSong {
  return transposeSong(song, 0, notation);
}

// Detect current notation of a song body
export function detectNotation(body: string): Notation {
  const latinMatch = body.match(/\[(Do|Ré|Mi|Fa|Sol|La|Si)/i);
  return latinMatch ? 'latin' : 'anglo';
}

// Section label → color class
export function sectionColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('refrain') || l.includes('chorus')) return 'text-[#9C3D6E]';
  if (l.includes('couplet') || l.includes('verse') || l.includes('strophe')) return 'text-[#B87333]';
  if (l.includes('pont') || l.includes('bridge')) return 'text-[#5A3318]';
  if (l.includes('intro')) return 'text-[#6B7280]';
  if (l.includes('outro') || l.includes('coda')) return 'text-[#6B7280]';
  return 'text-[#5A3318]';
}
