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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Role;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Role;
          active?: boolean;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          label: string;
          kind: FileKind;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          label?: string;
          kind?: FileKind;
          storage_path?: string;
        };
        Relationships: [];
      };
      rehearsals: {
        Row: {
          id: string;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Song = Database['public']['Tables']['songs']['Row']
export type SongFile = Database['public']['Tables']['song_files']['Row']
export type Rehearsal = Database['public']['Tables']['rehearsals']['Row']
export type RehearsalSong = Database['public']['Tables']['rehearsal_songs']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
