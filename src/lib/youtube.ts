/**
 * Helpers for parsing/validating YouTube links (song references).
 * Accepts watch?v=, youtu.be/ and /shorts/ URL formats.
 */

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/

/** Extracts the video ID from a YouTube URL, or null if the URL isn't recognized. */
export function parseYouTubeId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '')
  let id: string | null = null

  if (host === 'youtu.be') {
    id = parsed.pathname.split('/').filter(Boolean)[0] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v')
    } else if (parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] ?? null
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/embed/')[1]?.split('/')[0] ?? null
    }
  } else {
    return null
  }

  if (!id || !YOUTUBE_ID_RE.test(id)) return null
  return id
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeId(url) !== null
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
