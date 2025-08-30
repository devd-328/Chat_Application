import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          last_seen: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          last_seen?: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          created_by?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          user_id: string;
          room_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          user_id: string;
          room_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          user_id?: string;
          room_id?: string;
          created_at?: string;
        };
      };
    };
  };
};