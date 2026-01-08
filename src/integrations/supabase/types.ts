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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_processes: {
        Row: {
          brand_name: string
          business_area: string | null
          created_at: string | null
          deposit_date: string | null
          expiry_date: string | null
          grant_date: string | null
          id: string
          inpi_protocol: string | null
          ncl_classes: number[] | null
          next_step: string | null
          next_step_date: string | null
          notes: string | null
          perfex_project_id: string | null
          process_number: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_name: string
          business_area?: string | null
          created_at?: string | null
          deposit_date?: string | null
          expiry_date?: string | null
          grant_date?: string | null
          id?: string
          inpi_protocol?: string | null
          ncl_classes?: number[] | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          perfex_project_id?: string | null
          process_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_name?: string
          business_area?: string | null
          created_at?: string | null
          deposit_date?: string | null
          expiry_date?: string | null
          grant_date?: string | null
          id?: string
          inpi_protocol?: string | null
          ncl_classes?: number[] | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          perfex_project_id?: string | null
          process_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_processes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_html: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          perfex_contract_id: string | null
          process_id: string | null
          signed_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          contract_html?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          perfex_contract_id?: string | null
          process_id?: string | null
          signed_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          contract_html?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          perfex_contract_id?: string | null
          process_id?: string | null
          signed_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "brand_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          process_id: string | null
          uploaded_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          process_id?: string | null
          uploaded_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          process_id?: string | null
          uploaded_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "brand_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inpi_resources: {
        Row: {
          adjustments_history: Json | null
          approved_at: string | null
          brand_name: string | null
          created_at: string
          draft_content: string | null
          examiner_or_opponent: string | null
          final_content: string | null
          final_pdf_path: string | null
          holder: string | null
          id: string
          legal_basis: string | null
          ncl_class: string | null
          original_pdf_path: string | null
          process_number: string | null
          resource_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adjustments_history?: Json | null
          approved_at?: string | null
          brand_name?: string | null
          created_at?: string
          draft_content?: string | null
          examiner_or_opponent?: string | null
          final_content?: string | null
          final_pdf_path?: string | null
          holder?: string | null
          id?: string
          legal_basis?: string | null
          ncl_class?: string | null
          original_pdf_path?: string | null
          process_number?: string | null
          resource_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adjustments_history?: Json | null
          approved_at?: string | null
          brand_name?: string | null
          created_at?: string
          draft_content?: string | null
          examiner_or_opponent?: string | null
          final_content?: string | null
          final_pdf_path?: string | null
          holder?: string | null
          id?: string
          legal_basis?: string | null
          ncl_class?: string | null
          original_pdf_path?: string | null
          process_number?: string | null
          resource_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          asaas_invoice_id: string | null
          boleto_code: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          invoice_url: string | null
          payment_date: string | null
          payment_method: string | null
          pix_code: string | null
          process_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          asaas_invoice_id?: string | null
          boleto_code?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pix_code?: string | null
          process_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          asaas_invoice_id?: string | null
          boleto_code?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pix_code?: string | null
          process_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "brand_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          process_id: string | null
          rpi_number: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          process_id?: string | null
          rpi_number?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          process_id?: string | null
          rpi_number?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "brand_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          asaas_customer_id: string | null
          city: string | null
          company_name: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          perfex_customer_id: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          city?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          perfex_customer_id?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          city?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          perfex_customer_id?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
