export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'admin' | 'member';
export type FileKind = 'audio' | 'playback' | 'sheet';

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
          updated_at?: string;
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
          storage_path: string;
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
          storage_path: string;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          label?: string;
          kind?: FileKind;
          storage_path?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'] & { phone?: string | null }
export type Song = Database['public']['Tables']['songs']['Row']
export type SongFile = Database['public']['Tables']['song_files']['Row']

/** Which Supabase Storage bucket a SongFile lives in.
 *  Legacy files uploaded before the audio migration used 'media'.
 *  All new audio files use 'song-audios'. */
export function songFileBucket(file: Pick<SongFile, 'storage_path'>): string {
  return file.storage_path.startsWith('songs/') ? 'media' : 'song-audios'
}
export type Rehearsal = Database['public']['Tables']['rehearsals']['Row'] & {
  title?: string | null
  notify_selected?: boolean
  created_by?: string | null
}
export type RehearsalSong = Database['public']['Tables']['rehearsal_songs']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']

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

export type VocalRole = 'Soprano' | 'Alto' | 'Ténor' | 'Basse' | 'Lead' | 'Directeur' | 'Musicien' | 'Autre'
export const VOCAL_ROLES: VocalRole[] = ['Soprano', 'Alto', 'Ténor', 'Basse', 'Lead', 'Directeur', 'Musicien', 'Autre']
