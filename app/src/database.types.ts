// Mirrors the Supabase schema. Regenerate when tables change.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export type Person = {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  relationship: 'none' | 'incoming' | 'outgoing' | 'friend' | 'blocked';
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; name: string; handle: string; avatar_url: string | null; created_at: string },
        { id: string; name?: string; handle: string; avatar_url?: string | null }
      >;
      trips: Table<
        {
          id: string;
          owner_id: string;
          title: string;
          subtitle: string;
          start_date: string;
          end_date: string | null;
          status: string;
          cover_path: string | null;
          invite_token: string;
          share_token: string;
          created_at: string;
        },
        { title: string; subtitle?: string; start_date?: string; end_date?: string | null; status?: string }
      >;
      trip_members: Table<
        { trip_id: string; user_id: string; role: string; joined_at: string },
        { trip_id: string; user_id: string; role?: string }
      >;
      track_points: Table<
        { id: number; trip_id: string; user_id: string; lat: number; lng: number; recorded_at: string },
        { trip_id: string; lat: number; lng: number }
      >;
      saved_trips: Table<{ user_id: string; trip_id: string; saved_at: string }, { trip_id: string }>;
      stops: Table<
        {
          id: string;
          trip_id: string;
          author_id: string;
          title: string;
          note: string;
          category: string;
          lat: number;
          lng: number;
          taken_at: string;
          created_at: string;
        },
        { trip_id: string; title: string; note?: string; category?: string; lat: number; lng: number; taken_at?: string }
      >;
      photos: Table<
        { id: string; stop_id: string; trip_id: string; author_id: string; path: string; kind: 'photo' | 'video'; created_at: string },
        { stop_id: string; trip_id: string; path: string; kind?: 'photo' | 'video' }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      profile_people: { Args: { search_handle?: string }; Returns: Person[] };
      change_profile_relationship: { Args: { person_id: string; action: string }; Returns: undefined };
      report_profile: { Args: { person_id: string; report_reason: string; report_details: string }; Returns: undefined };
      add_member_by_handle: { Args: { trip: string; member_handle: string }; Returns: undefined };
      get_shared_trip: { Args: { token: string }; Returns: Json };
      is_trip_member: { Args: { t: string }; Returns: boolean };
      join_trip: { Args: { token: string }; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type Public = Database['public']['Tables'];
export type Row<T extends keyof Public> = Public[T]['Row'];

export type Trip = Row<'trips'>;
export type Stop = Row<'stops'>;
export type Photo = Row<'photos'>;
export type Profile = Row<'profiles'>;
