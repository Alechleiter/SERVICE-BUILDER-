// ══════════════════════════════════════════════════════════
// Database Types — mirrors Supabase schema
// Regenerate with: supabase gen types typescript --local
// ══════════════════════════════════════════════════════════

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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
        };
        Update: {
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };

      verticals: {
        Row: {
          id: string;
          label: string;
          icon: string;
          day_rate: number;
          night_rate: number;
          day_min: number;
          night_min: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          label: string;
          icon: string;
          day_rate: number;
          night_rate: number;
          day_min?: number;
          night_min?: number;
          sort_order?: number;
        };
        Update: {
          label?: string;
          icon?: string;
          day_rate?: number;
          night_rate?: number;
          day_min?: number;
          night_min?: number;
          sort_order?: number;
        };
        Relationships: [];
      };

      services: {
        Row: {
          id: string;
          service_type: "recurring" | "onetime";
          label: string;
          description: string;
          pricing_type: string;
          unit_label: string | null;
          default_qty: string | null;
          default_traps: number | null;
          default_mode: string | null;
          default_customer: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          service_type: "recurring" | "onetime";
          label: string;
          description: string;
          pricing_type: string;
          unit_label?: string | null;
          default_qty?: string | null;
          default_traps?: number | null;
          default_mode?: string | null;
          default_customer?: string | null;
          sort_order?: number;
        };
        Update: {
          label?: string;
          description?: string;
          pricing_type?: string;
          unit_label?: string | null;
          default_qty?: string | null;
          default_traps?: number | null;
          default_mode?: string | null;
          default_customer?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };

      vertical_recommended_services: {
        Row: {
          vertical_id: string;
          service_id: string;
        };
        Insert: {
          vertical_id: string;
          service_id: string;
        };
        Update: {
          vertical_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vertical_recommended_services_vertical_id_fkey";
            columns: ["vertical_id"];
            isOneToOne: false;
            referencedRelation: "verticals";
            referencedColumns: ["id"];
          },
        ];
      };

      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          vertical_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          address?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          vertical_id?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          address?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          vertical_id?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_vertical_id_fkey";
            columns: ["vertical_id"];
            isOneToOne: false;
            referencedRelation: "verticals";
            referencedColumns: ["id"];
          },
        ];
      };

      service_builder_sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          client_id: string | null;
          vertical_id: string;
          is_night: boolean;
          offering: Json;
          totals: Json;
          step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          vertical_id: string;
          is_night?: boolean;
          offering?: Json;
          totals?: Json;
          step?: number;
          name?: string | null;
          client_id?: string | null;
        };
        Update: {
          vertical_id?: string;
          is_night?: boolean;
          offering?: Json;
          totals?: Json;
          step?: number;
          name?: string | null;
          client_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_builder_sessions_vertical_id_fkey";
            columns: ["vertical_id"];
            isOneToOne: false;
            referencedRelation: "verticals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_builder_sessions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };

      proposals: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          session_id: string | null;
          template_id: string;
          name: string | null;
          form_data: Json;
          map_data: Json | null;
          inspection_date: string | null;
          status: "draft" | "sent" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          template_id: string;
          form_data?: Json;
          map_data?: Json | null;
          name?: string | null;
          client_id?: string | null;
          session_id?: string | null;
          inspection_date?: string | null;
          status?: "draft" | "sent" | "accepted" | "declined";
        };
        Update: {
          template_id?: string;
          form_data?: Json;
          map_data?: Json | null;
          name?: string | null;
          client_id?: string | null;
          session_id?: string | null;
          inspection_date?: string | null;
          status?: "draft" | "sent" | "accepted" | "declined";
        };
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "service_builder_sessions";
            referencedColumns: ["id"];
          },
        ];
      };

      proposal_snapshots: {
        Row: {
          id: string;
          proposal_id: string;
          user_id: string;
          variant: "customer" | "internal";
          html: string;
          snapshot_data: Json;
          version_number: number;
          created_at: string;
        };
        Insert: {
          proposal_id: string;
          user_id: string;
          variant: "customer" | "internal";
          html: string;
          snapshot_data?: Json;
          version_number?: number;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "proposal_snapshots_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };

      proposal_photos: {
        Row: {
          id: string;
          proposal_id: string;
          storage_path: string;
          file_name: string;
          caption: string;
          zone: string;
          unit_number: string;
          custom_zone: string;
          sort_order: number;
          created_at: string;
          data_url: string | null;
        };
        Insert: {
          proposal_id: string;
          storage_path?: string;
          file_name: string;
          caption?: string;
          zone?: string;
          unit_number?: string;
          custom_zone?: string;
          sort_order?: number;
          data_url?: string | null;
        };
        Update: {
          storage_path?: string;
          file_name?: string;
          caption?: string;
          zone?: string;
          unit_number?: string;
          custom_zone?: string;
          sort_order?: number;
          data_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposal_photos_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "proposals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Convenience aliases ──
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Vertical = Database["public"]["Tables"]["verticals"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type Session = Database["public"]["Tables"]["service_builder_sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["service_builder_sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["service_builder_sessions"]["Update"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];
export type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];
export type ProposalPhoto = Database["public"]["Tables"]["proposal_photos"]["Row"];
export type ProposalPhotoInsert = Database["public"]["Tables"]["proposal_photos"]["Insert"];
export type ProposalSnapshot = Database["public"]["Tables"]["proposal_snapshots"]["Row"];
export type ProposalSnapshotInsert = Database["public"]["Tables"]["proposal_snapshots"]["Insert"];
