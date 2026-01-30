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
      admin_permissions: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          permission_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          permission_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          permission_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          pipeline_stage: string | null
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
          pipeline_stage?: string | null
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
          pipeline_stage?: string | null
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
      client_activities: {
        Row: {
          activity_type: string
          admin_id: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          admin_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          admin_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_appointments: {
        Row: {
          admin_id: string
          completed: boolean | null
          created_at: string | null
          description: string | null
          id: string
          scheduled_at: string
          title: string
          user_id: string
        }
        Insert: {
          admin_id: string
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_at: string
          title: string
          user_id: string
        }
        Update: {
          admin_id?: string
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          scheduled_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          admin_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_attachments: {
        Row: {
          contract_id: string
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_comments: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_notes: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_notes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewal_history: {
        Row: {
          contract_id: string
          id: string
          new_end_date: string | null
          new_value: number | null
          notes: string | null
          previous_end_date: string | null
          previous_value: number | null
          renewed_at: string
          renewed_by: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          new_end_date?: string | null
          new_value?: number | null
          notes?: string | null
          previous_end_date?: string | null
          previous_value?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          new_end_date?: string | null
          new_value?: number | null
          notes?: string | null
          previous_end_date?: string | null
          previous_value?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewal_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          contract_type_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content: string
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          asaas_payment_id: string | null
          blockchain_hash: string | null
          blockchain_network: string | null
          blockchain_proof: string | null
          blockchain_timestamp: string | null
          blockchain_tx_id: string | null
          client_signature_image: string | null
          contract_html: string | null
          contract_number: string | null
          contract_type: string | null
          contract_type_id: string | null
          contract_value: number | null
          contractor_signature_image: string | null
          created_at: string | null
          description: string | null
          device_info: Json | null
          document_type: string | null
          end_date: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          ots_file_url: string | null
          payment_method: string | null
          penalty_value: number | null
          process_id: string | null
          signatory_cnpj: string | null
          signatory_cpf: string | null
          signatory_name: string | null
          signature_expires_at: string | null
          signature_ip: string | null
          signature_status: string | null
          signature_token: string | null
          signature_user_agent: string | null
          signed_at: string | null
          start_date: string | null
          subject: string | null
          template_id: string | null
          user_agent: string | null
          user_id: string | null
          visible_to_client: boolean | null
        }
        Insert: {
          asaas_payment_id?: string | null
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_proof?: string | null
          blockchain_timestamp?: string | null
          blockchain_tx_id?: string | null
          client_signature_image?: string | null
          contract_html?: string | null
          contract_number?: string | null
          contract_type?: string | null
          contract_type_id?: string | null
          contract_value?: number | null
          contractor_signature_image?: string | null
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          document_type?: string | null
          end_date?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          ots_file_url?: string | null
          payment_method?: string | null
          penalty_value?: number | null
          process_id?: string | null
          signatory_cnpj?: string | null
          signatory_cpf?: string | null
          signatory_name?: string | null
          signature_expires_at?: string | null
          signature_ip?: string | null
          signature_status?: string | null
          signature_token?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          start_date?: string | null
          subject?: string | null
          template_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visible_to_client?: boolean | null
        }
        Update: {
          asaas_payment_id?: string | null
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_proof?: string | null
          blockchain_timestamp?: string | null
          blockchain_tx_id?: string | null
          client_signature_image?: string | null
          contract_html?: string | null
          contract_number?: string | null
          contract_type?: string | null
          contract_type_id?: string | null
          contract_value?: number | null
          contractor_signature_image?: string | null
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          document_type?: string | null
          end_date?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          ots_file_url?: string | null
          payment_method?: string | null
          penalty_value?: number | null
          process_id?: string | null
          signatory_cnpj?: string | null
          signatory_cpf?: string | null
          signatory_name?: string | null
          signature_expires_at?: string | null
          signature_ip?: string | null
          signature_status?: string | null
          signature_token?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          start_date?: string | null
          subject?: string | null
          template_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "brand_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
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
          contract_id: string | null
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
          contract_id?: string | null
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
          contract_id?: string | null
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
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
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
      email_accounts: {
        Row: {
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_port: number | null
          is_default: boolean | null
          provider: string
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_default?: boolean | null
          provider?: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_default?: boolean | null
          provider?: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_inbox: {
        Row: {
          account_id: string | null
          body_html: string | null
          body_text: string | null
          created_at: string | null
          from_email: string
          from_name: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          message_id: string | null
          received_at: string | null
          subject: string | null
          to_email: string
        }
        Insert: {
          account_id?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          received_at?: string | null
          subject?: string | null
          to_email: string
        }
        Update: {
          account_id?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          received_at?: string | null
          subject?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_inbox_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bcc_emails: string[] | null
          body: string
          cc_emails: string[] | null
          error_message: string | null
          from_email: string
          html_body: string | null
          id: string
          related_lead_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
          trigger_type: string | null
        }
        Insert: {
          bcc_emails?: string[] | null
          body: string
          cc_emails?: string[] | null
          error_message?: string | null
          from_email: string
          html_body?: string | null
          id?: string
          related_lead_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
          trigger_type?: string | null
        }
        Update: {
          bcc_emails?: string[] | null
          body?: string
          cc_emails?: string[] | null
          error_message?: string | null
          from_email?: string
          html_body?: string | null
          id?: string
          related_lead_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          trigger_event: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          trigger_event?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          trigger_event?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string
          errors: Json | null
          failed_records: number | null
          file_name: string | null
          id: string
          import_type: string
          imported_by: string | null
          imported_records: number | null
          total_records: number | null
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          imported_records?: number | null
          total_records?: number | null
        }
        Update: {
          created_at?: string
          errors?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          imported_records?: number | null
          total_records?: number | null
        }
        Relationships: []
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
          asaas_customer_id: string | null
          asaas_invoice_id: string | null
          boleto_code: string | null
          contract_id: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          invoice_url: string | null
          payment_date: string | null
          payment_link: string | null
          payment_method: string | null
          pix_code: string | null
          pix_payload: string | null
          pix_qr_code: string | null
          process_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          asaas_customer_id?: string | null
          asaas_invoice_id?: string | null
          boleto_code?: string | null
          contract_id?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_payload?: string | null
          pix_qr_code?: string | null
          process_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          asaas_customer_id?: string | null
          asaas_invoice_id?: string | null
          boleto_code?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_payload?: string | null
          pix_qr_code?: string | null
          process_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
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
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          city: string | null
          company_name: string | null
          converted_at: string | null
          converted_to_client_id: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          email_opt_out: boolean | null
          estimated_value: number | null
          form_started_at: string | null
          full_name: string
          id: string
          last_reminder_sent_at: string | null
          notes: string | null
          origin: string | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          company_name?: string | null
          converted_at?: string | null
          converted_to_client_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          email_opt_out?: boolean | null
          estimated_value?: number | null
          form_started_at?: string | null
          full_name: string
          id?: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          company_name?: string | null
          converted_at?: string | null
          converted_to_client_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          email_opt_out?: boolean | null
          estimated_value?: number | null
          form_started_at?: string | null
          full_name?: string
          id?: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
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
      notification_logs: {
        Row: {
          channel: string
          error_message: string | null
          id: string
          notification_id: string | null
          recipient: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          name: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          name: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          name?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channels: Json | null
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
          channels?: Json | null
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
          channels?: Json | null
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
          client_funnel_type: string | null
          cnpj: string | null
          company_name: string | null
          contract_value: number | null
          cpf: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_contact: string | null
          neighborhood: string | null
          origin: string | null
          phone: string | null
          priority: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          city?: string | null
          client_funnel_type?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_value?: number | null
          cpf?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_contact?: string | null
          neighborhood?: string | null
          origin?: string | null
          phone?: string | null
          priority?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          city?: string | null
          client_funnel_type?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_value?: number | null
          cpf?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_contact?: string | null
          neighborhood?: string | null
          origin?: string | null
          phone?: string | null
          priority?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      rpi_entries: {
        Row: {
          attorney_name: string | null
          brand_name: string | null
          created_at: string
          dispatch_code: string | null
          dispatch_text: string | null
          dispatch_type: string | null
          holder_name: string | null
          id: string
          matched_client_id: string | null
          matched_process_id: string | null
          ncl_classes: string[] | null
          process_number: string
          publication_date: string | null
          rpi_upload_id: string
          tag: string | null
          update_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          attorney_name?: string | null
          brand_name?: string | null
          created_at?: string
          dispatch_code?: string | null
          dispatch_text?: string | null
          dispatch_type?: string | null
          holder_name?: string | null
          id?: string
          matched_client_id?: string | null
          matched_process_id?: string | null
          ncl_classes?: string[] | null
          process_number: string
          publication_date?: string | null
          rpi_upload_id: string
          tag?: string | null
          update_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          attorney_name?: string | null
          brand_name?: string | null
          created_at?: string
          dispatch_code?: string | null
          dispatch_text?: string | null
          dispatch_type?: string | null
          holder_name?: string | null
          id?: string
          matched_client_id?: string | null
          matched_process_id?: string | null
          ncl_classes?: string[] | null
          process_number?: string
          publication_date?: string | null
          rpi_upload_id?: string
          tag?: string | null
          update_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rpi_entries_rpi_upload_id_fkey"
            columns: ["rpi_upload_id"]
            isOneToOne: false
            referencedRelation: "rpi_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      rpi_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          processed_at: string | null
          rpi_date: string | null
          rpi_number: string | null
          status: string
          summary: string | null
          total_clients_matched: number | null
          total_processes_found: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          processed_at?: string | null
          rpi_date?: string | null
          rpi_number?: string | null
          status?: string
          summary?: string | null
          total_clients_matched?: number | null
          total_processes_found?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          processed_at?: string | null
          rpi_date?: string | null
          rpi_number?: string | null
          status?: string
          summary?: string | null
          total_clients_matched?: number | null
          total_processes_found?: number | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      signature_audit_log: {
        Row: {
          contract_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
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
      viability_searches: {
        Row: {
          brand_name: string
          business_area: string
          created_at: string | null
          id: string
          ip_hash: string | null
          result_level: string | null
        }
        Insert: {
          brand_name: string
          business_area: string
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          result_level?: string | null
        }
        Update: {
          brand_name?: string
          business_area?: string
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          result_level?: string | null
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          api_key: string
          company_id: string | null
          created_at: string | null
          id: string
          instance_name: string | null
          is_active: boolean | null
          server_url: string | null
          updated_at: string | null
        }
        Insert: {
          api_key: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean | null
          server_url?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean | null
          server_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_role: { Args: { target_user_id: string }; Returns: undefined }
      has_current_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      merge_duplicate_clients: {
        Args: { keep_id: string; merge_id: string }
        Returns: undefined
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
