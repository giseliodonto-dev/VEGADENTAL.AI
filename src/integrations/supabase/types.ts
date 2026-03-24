export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          alcohol: boolean | null
          allergies: string | null
          bruxism: boolean | null
          clinic_id: string
          created_at: string
          current_pain: boolean | null
          diseases: string[] | null
          gum_bleeding: boolean | null
          id: string
          medications: string | null
          patient_id: string
          public_token: string | null
          response_date: string | null
          sensitivity: boolean | null
          signature: string | null
          signed_at: string | null
          smoker: boolean | null
          status: string
          surgeries: boolean | null
          updated_at: string
        }
        Insert: {
          alcohol?: boolean | null
          allergies?: string | null
          bruxism?: boolean | null
          clinic_id: string
          created_at?: string
          current_pain?: boolean | null
          diseases?: string[] | null
          gum_bleeding?: boolean | null
          id?: string
          medications?: string | null
          patient_id: string
          public_token?: string | null
          response_date?: string | null
          sensitivity?: boolean | null
          signature?: string | null
          signed_at?: string | null
          smoker?: boolean | null
          status?: string
          surgeries?: boolean | null
          updated_at?: string
        }
        Update: {
          alcohol?: boolean | null
          allergies?: string | null
          bruxism?: boolean | null
          clinic_id?: string
          created_at?: string
          current_pain?: boolean | null
          diseases?: string[] | null
          gum_bleeding?: boolean | null
          id?: string
          medications?: string | null
          patient_id?: string
          public_token?: string | null
          response_date?: string | null
          sensitivity?: boolean | null
          signature?: string | null
          signed_at?: string | null
          smoker?: boolean | null
          status?: string
          surgeries?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          dentist_user_id: string | null
          duration_minutes: number | null
          estimated_value: number | null
          id: string
          notes: string | null
          patient_id: string | null
          procedure_type: string | null
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          dentist_user_id?: string | null
          duration_minutes?: number | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          procedure_type?: string | null
          status?: string
          time: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          dentist_user_id?: string | null
          duration_minutes?: number | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          procedure_type?: string | null
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          id: string
          notes: string | null
          procedure_name: string
          region: string | null
          tooth_number: string | null
          treatment_id: string | null
          value: number
        }
        Insert: {
          budget_id: string
          id?: string
          notes?: string | null
          procedure_name: string
          region?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          value?: number
        }
        Update: {
          budget_id?: string
          id?: string
          notes?: string | null
          procedure_name?: string
          region?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          accepted_at: string | null
          accepted_signature: string | null
          clinic_id: string
          created_at: string
          dentist_user_id: string | null
          discount: number | null
          final_value: number
          id: string
          notes: string | null
          patient_id: string
          public_token: string | null
          status: string
          total_value: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_signature?: string | null
          clinic_id: string
          created_at?: string
          dentist_user_id?: string | null
          discount?: number | null
          final_value?: number
          id?: string
          notes?: string | null
          patient_id: string
          public_token?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_signature?: string | null
          clinic_id?: string
          created_at?: string
          dentist_user_id?: string | null
          discount?: number | null
          final_value?: number
          id?: string
          notes?: string | null
          patient_id?: string
          public_token?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          channel: string
          clinic_id: string
          created_at: string
          end_date: string | null
          id: string
          investment: number | null
          leads_generated: number | null
          name: string
          notes: string | null
          sales_closed: number | null
          start_date: string
          status: string
        }
        Insert: {
          channel?: string
          clinic_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          investment?: number | null
          leads_generated?: number | null
          name: string
          notes?: string | null
          sales_closed?: number | null
          start_date?: string
          status?: string
        }
        Update: {
          channel?: string
          clinic_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          investment?: number | null
          leads_generated?: number | null
          name?: string
          notes?: string | null
          sales_closed?: number | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          commission_rate: number | null
          contract_type: string | null
          created_at: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          commission_rate?: number | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          commission_rate?: number | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          clinic_id: string
          content_type: string
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          status: string
          theme: string | null
          title: string
        }
        Insert: {
          clinic_id: string
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          theme?: string | null
          title: string
        }
        Update: {
          clinic_id?: string
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          theme?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      financials: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          patient_id: string | null
          payment_method: string | null
          responsible_user_id: string | null
          status: string
          type: string
          value: number
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          patient_id?: string | null
          payment_method?: string | null
          responsible_user_id?: string | null
          status?: string
          type: string
          value: number
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          patient_id?: string | null
          payment_method?: string | null
          responsible_user_id?: string | null
          status?: string
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "financials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          clinic_id: string
          conversion_goal: number | null
          created_at: string
          current_result: number | null
          id: string
          month: string
          profit_goal: number | null
          revenue_goal: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          conversion_goal?: number | null
          created_at?: string
          current_result?: number | null
          id?: string
          month: string
          profit_goal?: number | null
          revenue_goal?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          conversion_goal?: number | null
          created_at?: string
          current_result?: number | null
          id?: string
          month?: string
          profit_goal?: number | null
          revenue_goal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          clinic_id: string
          contact: string | null
          created_at: string
          entry_date: string
          id: string
          name: string
          notes: string | null
          origin: string | null
          responsible_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          contact?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          name: string
          notes?: string | null
          origin?: string | null
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          contact?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          name?: string
          notes?: string | null
          origin?: string | null
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          name: string
          origin: string | null
          phone: string | null
          responsible_user_id: string | null
          status: string
          treatment_value: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          origin?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          status?: string
          treatment_value?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          origin?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          status?: string
          treatment_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          treatment_id: string
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          treatment_id: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures_catalog: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          default_value: number | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          is_favorite: boolean | null
          name: string
        }
        Insert: {
          category: string
          clinic_id: string
          created_at?: string
          default_value?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          is_favorite?: boolean | null
          name: string
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          default_value?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          is_favorite?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_catalog_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_funnel: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          patient_id: string | null
          responsible_user_id: string | null
          stage: string
          updated_at: string
          value: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          responsible_user_id?: string | null
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          responsible_user_id?: string | null
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_funnel_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          amount_paid: number
          clinic_id: string
          created_at: string
          date: string
          dentist_user_id: string | null
          id: string
          installments: number | null
          notes: string | null
          patient_id: string
          payment_status: string
          payment_type: string | null
          procedure_type: string
          region: string | null
          status: string
          tooth_number: string | null
          updated_at: string
          value: number
        }
        Insert: {
          amount_paid?: number
          clinic_id: string
          created_at?: string
          date?: string
          dentist_user_id?: string | null
          id?: string
          installments?: number | null
          notes?: string | null
          patient_id: string
          payment_status?: string
          payment_type?: string | null
          procedure_type: string
          region?: string | null
          status?: string
          tooth_number?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          amount_paid?: number
          clinic_id?: string
          created_at?: string
          date?: string
          dentist_user_id?: string | null
          id?: string
          installments?: number | null
          notes?: string | null
          patient_id?: string
          payment_status?: string
          payment_type?: string | null
          procedure_type?: string
          region?: string | null
          status?: string
          tooth_number?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clinic_ids: { Args: { _user_id: string }; Returns: string[] }
      has_clinic_role: {
        Args: {
          _clinic_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_member: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      seed_default_procedures: {
        Args: { _clinic_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "dono" | "recepcao" | "dentista" | "crm" | "sdr"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["dono", "recepcao", "dentista", "crm", "sdr"],
    },
  },
} as const
