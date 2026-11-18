// Database types for the Supabase schema in supabase/migrations.
// Regenerate with: npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type UserRole = "patient" | "professional" | "companion";
type ConsentPurpose = "service" | "research";
type ConsentMethod = "own_account" | "in_person";
type LinkRelation = "professional" | "companion";
type LinkStatus = "active" | "revoked";
type AssessmentMode = "self" | "professional" | "companion";
type AssessmentStatus = "in_progress" | "completed" | "abandoned";
type ResultLevel = "strength" | "expected" | "watch" | "refer";
type CognitiveDomain = "attention" | "memory";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: UserRole; display_name: string; created_at: string };
        Insert: { id: string; role: UserRole; display_name: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string | null;
          created_by: string | null;
          display_name: string;
          birth_year: number;
          education_years: number;
          created_at: string;
        };
        Insert: never;
        Update: { display_name?: string; education_years?: number };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          subject_id: string | null;
          purpose: ConsentPurpose;
          notice_version: string;
          method: ConsentMethod;
          captured_by: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      link_codes: {
        Row: {
          code: string;
          subject_id: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          subject_id: string;
          linked_user_id: string;
          relation: LinkRelation;
          status: LinkStatus;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "links_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          code: string;
          domain: CognitiveDomain;
          name: string;
          description: string;
          version: string;
          active: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          subject_id: string;
          mode: AssessmentMode;
          administered_by: string | null;
          status: AssessmentStatus;
          started_at: string;
          completed_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "assessments_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      task_runs: {
        Row: {
          id: string;
          assessment_id: string;
          task_code: string;
          task_version: string;
          trials: Json;
          metrics: Json;
          raw_score: number;
          index_score: number;
          level: ResultLevel;
          completed_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          task_code: string;
          task_version: string;
          trials: Json;
          metrics?: Json;
          raw_score: number;
          index_score: number;
          level: ResultLevel;
          completed_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "task_runs_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_runs_task_code_fkey";
            columns: ["task_code"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["code"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      complete_onboarding: {
        Args: {
          p_role: UserRole;
          p_display_name: string;
          p_birth_year?: number;
          p_education_years?: number;
          p_notice_version?: string;
          p_research_consent?: boolean;
        };
        Returns: undefined;
      };
      create_managed_subject: {
        Args: {
          p_display_name: string;
          p_birth_year: number;
          p_education_years: number;
          p_notice_version: string;
          p_research_consent?: boolean;
        };
        Returns: string;
      };
      create_link_code: { Args: Record<string, never>; Returns: string };
      redeem_link_code: { Args: { p_code: string }; Returns: string };
      revoke_link: { Args: { p_link_id: string }; Returns: undefined };
      set_consent: {
        Args: { p_subject_id: string; p_purpose: ConsentPurpose; p_granted: boolean; p_notice_version: string };
        Returns: undefined;
      };
      start_assessment: { Args: { p_subject_id: string }; Returns: string };
      complete_assessment: { Args: { p_assessment_id: string }; Returns: undefined };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      my_role: { Args: Record<string, never>; Returns: UserRole };
      has_service_consent: { Args: { p_subject_id: string }; Returns: boolean };
      is_subject_owner: { Args: { p_subject_id: string }; Returns: boolean };
      can_access_subject: { Args: { p_subject_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      consent_purpose: ConsentPurpose;
      consent_method: ConsentMethod;
      link_relation: LinkRelation;
      link_status: LinkStatus;
      assessment_mode: AssessmentMode;
      assessment_status: AssessmentStatus;
      result_level: ResultLevel;
      cognitive_domain: CognitiveDomain;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
