export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'admin' | 'leader' | 'member';
export type FileKind = 'audio' | 'playback' | 'sheet' | 'youtube';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          active: boolean;
          phone: string | null;
          email: string | null;
          date_naissance: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Role;
          active?: boolean;
          phone?: string | null;
          email?: string | null;
          date_naissance?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Role;
          active?: boolean;
          phone?: string | null;
          email?: string | null;
          date_naissance?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      birthday_notifications: {
        Row: {
          id: string;
          profile_id: string;
          year: number;
          card_generated: boolean;
          email_sent: boolean;
          whatsapp_shared: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          year?: number;
          card_generated?: boolean;
          email_sent?: boolean;
          whatsapp_shared?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          card_generated?: boolean;
          email_sent?: boolean;
          whatsapp_shared?: boolean;
          notified_at?: string | null;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          title: string;
          key_signature: string | null;
          tempo: number | null;
          time_signature: string | null;
          author: string | null;
          notation: 'latin' | 'anglo';
          body: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          key_signature?: string | null;
          tempo?: number | null;
          time_signature?: string | null;
          author?: string | null;
          notation?: 'latin' | 'anglo';
          body: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          key_signature?: string | null;
          tempo?: number | null;
          time_signature?: string | null;
          author?: string | null;
          notation?: 'latin' | 'anglo';
          body?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      song_files: {
        Row: {
          id: string;
          song_id: string;
          label: string;
          kind: FileKind;
          storage_path: string | null;
          video_url: string | null;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          label: string;
          kind: FileKind;
          storage_path?: string | null;
          video_url?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          label?: string;
          kind?: FileKind;
          storage_path?: string | null;
          video_url?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
        };
        Relationships: [];
      };
      rehearsals: {
        Row: {
          id: string;
          title: string | null;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          notes: string | null;
          notify_selected: boolean;
          public_token: string | null;
          public_access_enabled: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          notify_selected?: boolean;
          public_token?: string | null;
          public_access_enabled?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          notify_selected?: boolean;
          public_token?: string | null;
          public_access_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehearsal_choristers: {
        Row: {
          id: string;
          rehearsal_id: string;
          profile_id: string;
          vocal_role: string;
          notified_email: boolean;
          notified_whatsapp: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          rehearsal_id: string;
          profile_id: string;
          vocal_role?: string;
          notified_email?: boolean;
          notified_whatsapp?: boolean;
          created_at?: string;
        };
        Update: {
          vocal_role?: string;
          notified_email?: boolean;
          notified_whatsapp?: boolean;
        };
        Relationships: [];
      };
      service_program_items: {
        Row: {
          id: string;
          rehearsal_id: string;
          order_index: number;
          item_type: string;
          label: string;
          profile_id: string | null;
          external_name: string | null;
          external_email: string | null;
          external_phone: string | null;
          note: string | null;
          notified_email: boolean;
          notified_whatsapp: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rehearsal_id: string;
          order_index?: number;
          item_type?: string;
          label: string;
          profile_id?: string | null;
          external_name?: string | null;
          external_email?: string | null;
          external_phone?: string | null;
          note?: string | null;
          notified_email?: boolean;
          notified_whatsapp?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          order_index?: number;
          item_type?: string;
          label?: string;
          profile_id?: string | null;
          external_name?: string | null;
          external_email?: string | null;
          external_phone?: string | null;
          note?: string | null;
          notified_email?: boolean;
          notified_whatsapp?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehearsal_songs: {
        Row: {
          id: string;
          rehearsal_id: string;
          song_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          rehearsal_id: string;
          song_id: string;
          order_index?: number;
        };
        Update: {
          order_index?: number;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          pinned: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          pinned?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcement_recipients: {
        Row: {
          id: string;
          announcement_id: string;
          profile_id: string;
          channel: string;
          status: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          profile_id: string;
          channel?: string;
          status?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type BirthdayNotification = Database['public']['Tables']['birthday_notifications']['Row']
export type Song = Database['public']['Tables']['songs']['Row']
export type SongFile = Database['public']['Tables']['song_files']['Row']

/** Which Supabase Storage bucket a SongFile lives in.
 *  Legacy files uploaded before the audio migration used 'media'.
 *  All new audio files use 'song-audios'. */
export function songFileBucket(file: Pick<SongFile, 'storage_path'>): string {
  return file.storage_path?.startsWith('songs/') ? 'media' : 'song-audios'
}
export type Rehearsal = Database['public']['Tables']['rehearsals']['Row'] & {
  title?: string | null
  notify_selected?: boolean
  created_by?: string | null
}
export type RehearsalSong = Database['public']['Tables']['rehearsal_songs']['Row']
export type ServiceProgramItem = Database['public']['Tables']['service_program_items']['Row']
export type ServiceProgramItemWithProfile = ServiceProgramItem & {
  profiles?: Pick<Profile, 'id' | 'full_name'> | null
}
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementRecipient = Database['public']['Tables']['announcement_recipients']['Row']

/** Announcement enrichi avec le comptage des destinataires (issu du select embedded) */
export type AnnouncementWithRecipients = Announcement & {
  announcement_recipients: Pick<AnnouncementRecipient, 'id' | 'status'>[]
}

export type RehearsalChorister = {
  id: string
  rehearsal_id: string
  profile_id: string
  vocal_role: string
  notified_email: boolean
  notified_whatsapp: boolean
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'phone'>
}

export type VocalRole =
  | 'Soprano' | 'Alto' | 'Ténor' | 'Basse' | 'Lead' | 'Directeur' | 'Musicien'
  | 'Multimédia (Videopsalm)' | 'Multimédia (Livestreaming)' | 'Multimédia (Photographe)' | 'Multimédia (Sonorisation)'
  | 'Autre'

export const VOCAL_ROLES: VocalRole[] = [
  'Soprano', 'Alto', 'Ténor', 'Basse', 'Lead', 'Directeur', 'Musicien',
  'Multimédia (Videopsalm)', 'Multimédia (Livestreaming)', 'Multimédia (Photographe)', 'Multimédia (Sonorisation)',
  'Autre',
]

// ── Birthday helpers ──────────────────────────────────────────────────────────

/** Returns a Date for this year's birthday (ignores year in the stored date). */
export function birthdayThisYear(dateNaissance: string): Date {
  const [, m, d] = dateNaissance.split('-')
  return new Date(new Date().getFullYear(), parseInt(m) - 1, parseInt(d))
}

/** Number of days until the next birthday (0 = today). */
export function daysUntilBirthday(dateNaissance: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let bday = birthdayThisYear(dateNaissance)
  if (bday < today) bday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
  return Math.round((bday.getTime() - today.getTime()) / 86_400_000)
}

export function isBirthdayToday(dateNaissance: string): boolean {
  return daysUntilBirthday(dateNaissance) === 0
}

export function isBirthdayThisWeek(dateNaissance: string): boolean {
  const d = daysUntilBirthday(dateNaissance)
  return d >= 0 && d <= 7
}

export function isBirthdayThisMonth(dateNaissance: string): boolean {
  const today = new Date()
  const [, m] = dateNaissance.split('-')
  return today.getMonth() + 1 === parseInt(m)
}

/** "15 janvier" — no year displayed */
export function formatBirthdayDisplay(dateNaissance: string): string {
  const [, m, d] = dateNaissance.split('-')
  return new Date(2000, parseInt(m) - 1, parseInt(d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

/** Age this year */
export function ageThisYear(dateNaissance: string): number {
  return new Date().getFullYear() - parseInt(dateNaissance.split('-')[0])
}
