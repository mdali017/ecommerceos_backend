export type UserRole = "customer" | "admin";

export type CustomerSource = "campaign" | "default" | "checkout";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  password_hash: string;
  source: CustomerSource;
  created_at: string;
  updated_at: string;
}

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  role: UserRole;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: CustomerRow;
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email: string;
          address?: string;
          password_hash: string;
          source?: CustomerSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          address?: string;
          password_hash?: string;
          source?: CustomerSource;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: AdminRow;
        Insert: {
          id?: string;
          name: string;
          email: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      refresh_tokens: {
        Row: RefreshTokenRow;
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          token_hash: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          token_hash?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
