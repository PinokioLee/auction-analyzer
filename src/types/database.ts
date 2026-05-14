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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis_history: {
        Row: {
          acquisition_tax: number | null
          apartment_name: string
          area: number
          bid_price: number
          created_at: string | null
          enforcement_cost: number | null
          eviction_cost: number | null
          floor: number
          id: string
          interior_cost: number | null
          legal_fee: number | null
          loan_amount: number | null
          loan_fee: number | null
          loan_interest: number | null
          prepayment_penalty: number | null
          price_analysis: Json | null
          total_cost: number | null
          total_floors: number
          unpaid_maintenance: number | null
        }
        Insert: {
          acquisition_tax?: number | null
          apartment_name: string
          area: number
          bid_price: number
          created_at?: string | null
          enforcement_cost?: number | null
          eviction_cost?: number | null
          floor: number
          id?: string
          interior_cost?: number | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_fee?: number | null
          loan_interest?: number | null
          prepayment_penalty?: number | null
          price_analysis?: Json | null
          total_cost?: number | null
          total_floors: number
          unpaid_maintenance?: number | null
        }
        Update: {
          acquisition_tax?: number | null
          apartment_name?: string
          area?: number
          bid_price?: number
          created_at?: string | null
          enforcement_cost?: number | null
          eviction_cost?: number | null
          floor?: number
          id?: string
          interior_cost?: number | null
          legal_fee?: number | null
          loan_amount?: number | null
          loan_fee?: number | null
          loan_interest?: number | null
          prepayment_penalty?: number | null
          price_analysis?: Json | null
          total_cost?: number | null
          total_floors?: number
          unpaid_maintenance?: number | null
        }
        Relationships: []
      }
      complex_cache: {
        Row: {
          complex_no: string
          complex_name: string
          address: string | null
          pyeongs: Json
          cached_at: string | null
        }
        Insert: {
          complex_no: string
          complex_name: string
          address?: string | null
          pyeongs: Json
          cached_at?: string | null
        }
        Update: {
          complex_no?: string
          complex_name?: string
          address?: string | null
          pyeongs?: Json
          cached_at?: string | null
        }
        Relationships: []
      }
      apartment_trade: {
        Row: {
          id: number
          lawd_cd: string
          deal_ymd: string
          apt_name: string
          exclusive_area: number
          deal_amount: number
          floor: number | null
          build_year: number | null
          dong: string | null
          jibun: string | null
          deal_date: string
          created_at: string | null
        }
        Insert: {
          id?: number
          lawd_cd: string
          deal_ymd: string
          apt_name: string
          exclusive_area: number
          deal_amount: number
          floor?: number | null
          build_year?: number | null
          dong?: string | null
          jibun?: string | null
          deal_date: string
          created_at?: string | null
        }
        Update: {
          id?: number
          lawd_cd?: string
          deal_ymd?: string
          apt_name?: string
          exclusive_area?: number
          deal_amount?: number
          floor?: number | null
          build_year?: number | null
          dong?: string | null
          jibun?: string | null
          deal_date?: string
          created_at?: string | null
        }
        Relationships: []
      }
      backfill_progress: {
        Row: {
          lawd_cd: string
          deal_ymd: string
          status: string
          row_count: number | null
          fetched_at: string | null
          error_message: string | null
        }
        Insert: {
          lawd_cd: string
          deal_ymd: string
          status: string
          row_count?: number | null
          fetched_at?: string | null
          error_message?: string | null
        }
        Update: {
          lawd_cd?: string
          deal_ymd?: string
          status?: string
          row_count?: number | null
          fetched_at?: string | null
          error_message?: string | null
        }
        Relationships: []
      }
      daily_sync_log: {
        Row: {
          id: number
          run_date: string
          target_ymds: string[]
          total_calls: number | null
          total_rows: number | null
          failed_regions: string[] | null
          duration_seconds: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          run_date: string
          target_ymds: string[]
          total_calls?: number | null
          total_rows?: number | null
          failed_regions?: string[] | null
          duration_seconds?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          run_date?: string
          target_ymds?: string[]
          total_calls?: number | null
          total_rows?: number | null
          failed_regions?: string[] | null
          duration_seconds?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      apartment_master: {
        Row: {
          id: string
          lawd_cd: string
          apt_name: string
          apt_name_norm: string | null
          addr: string | null
          total_floors: number | null
          total_household: number | null
          build_year: number | null
          dong_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lawd_cd: string
          apt_name: string
          apt_name_norm?: string | null
          addr?: string | null
          total_floors?: number | null
          total_household?: number | null
          build_year?: number | null
          dong_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lawd_cd?: string
          apt_name?: string
          apt_name_norm?: string | null
          addr?: string | null
          total_floors?: number | null
          total_household?: number | null
          build_year?: number | null
          dong_name?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      apartment_alias: {
        Row: {
          id: string
          raw_name: string
          normalized_name: string
          lawd_cd: string | null
        }
        Insert: {
          id?: string
          raw_name: string
          normalized_name: string
          lawd_cd?: string | null
        }
        Update: {
          id?: string
          raw_name?: string
          normalized_name?: string
          lawd_cd?: string | null
        }
        Relationships: []
      }
      apartment_rent: {
        Row: {
          id: string
          lawd_cd: string
          apt_name: string
          exclusive_area: number
          floor: number | null
          rent_type: string | null
          deposit: number | null
          monthly_rent: number | null
          contract_year: string | null
          contract_month: string | null
          deal_date: string | null
          apt_master_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lawd_cd: string
          apt_name: string
          exclusive_area: number
          floor?: number | null
          rent_type?: string | null
          deposit?: number | null
          monthly_rent?: number | null
          contract_year?: string | null
          contract_month?: string | null
          deal_date?: string | null
          apt_master_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lawd_cd?: string
          apt_name?: string
          exclusive_area?: number
          floor?: number | null
          rent_type?: string | null
          deposit?: number | null
          monthly_rent?: number | null
          contract_year?: string | null
          contract_month?: string | null
          apt_master_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      apartment_monthly_stats: {
        Row: {
          id: string
          apt_master_id: string | null
          exclusive_area: number | null
          year_month: string | null
          avg_price: number | null
          min_price: number | null
          max_price: number | null
          trade_count: number | null
        }
        Insert: {
          id?: string
          apt_master_id?: string | null
          exclusive_area?: number | null
          year_month?: string | null
          avg_price?: number | null
          min_price?: number | null
          max_price?: number | null
          trade_count?: number | null
        }
        Update: {
          id?: string
          apt_master_id?: string | null
          exclusive_area?: number | null
          year_month?: string | null
          avg_price?: number | null
          min_price?: number | null
          max_price?: number | null
          trade_count?: number | null
        }
        Relationships: []
      }
      apartment_rent_monthly_stats: {
        Row: {
          id: string
          apt_master_id: string | null
          exclusive_area: number | null
          year_month: string | null
          avg_deposit: number | null
          trade_count: number | null
        }
        Insert: {
          id?: string
          apt_master_id?: string | null
          exclusive_area?: number | null
          year_month?: string | null
          avg_deposit?: number | null
          trade_count?: number | null
        }
        Update: {
          id?: string
          apt_master_id?: string | null
          exclusive_area?: number | null
          year_month?: string | null
          avg_deposit?: number | null
          trade_count?: number | null
        }
        Relationships: []
      }
      field_records: {
        Row: {
          id: string
          user_id: string
          case_number: string | null
          bid_date: string | null
          lawd_cd: string | null
          apt_name: string | null
          exclusive_area: number | null
          memo: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          case_number?: string | null
          bid_date?: string | null
          lawd_cd?: string | null
          apt_name?: string | null
          exclusive_area?: number | null
          memo?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          case_number?: string | null
          bid_date?: string | null
          lawd_cd?: string | null
          apt_name?: string | null
          exclusive_area?: number | null
          memo?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profit_calculations: {
        Row: {
          id: string
          user_id: string | null
          lawd_cd: string | null
          apt_name: string | null
          exclusive_area: number | null
          input_data: Json | null
          result_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          lawd_cd?: string | null
          apt_name?: string | null
          exclusive_area?: number | null
          input_data?: Json | null
          result_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          lawd_cd?: string | null
          apt_name?: string | null
          exclusive_area?: number | null
          input_data?: Json | null
          result_data?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          category: string | null
          status: string | null
          like_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          category?: string | null
          status?: string | null
          like_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          category?: string | null
          status?: string | null
          like_count?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_apartments: {
        Args: {
          p_lawd_cd: string
          p_query?: string
        }
        Returns: {
          name: string
          count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
