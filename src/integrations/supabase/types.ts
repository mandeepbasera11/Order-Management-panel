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
  public: {
    Tables: {
      csv_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_count: number
          filename: string
          id: string
          import_type: string
          progress: number
          started_at: string
          status: string
          success_count: number
          total_rows: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_count?: number
          filename: string
          id?: string
          import_type: string
          progress?: number
          started_at?: string
          status?: string
          success_count?: number
          total_rows?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_count?: number
          filename?: string
          id?: string
          import_type?: string
          progress?: number
          started_at?: string
          status?: string
          success_count?: number
          total_rows?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          aspect: string | null
          base_ge_sku: string | null
          brand: string | null
          brand_logo: string | null
          category: string
          created_at: string
          description: string | null
          features_and_benefits: string | null
          id: string
          images: string | null
          item_name: string | null
          manufacturer_product_code: string | null
          master_brand_id: string | null
          master_model_id: string | null
          max_inflation_press: string | null
          max_load: string | null
          meas_rim_width: string | null
          model: string | null
          mtlid: string | null
          name: string
          overall_diam: string | null
          p_metric: string | null
          ply: string | null
          ply_rating: string | null
          price: number
          raw_size: string | null
          revs_per_mile: string | null
          rim: string | null
          rim_width_max: string | null
          rim_width_min: string | null
          rim_width_range: string | null
          run_flat: string | null
          section: string | null
          sidewall_abr: string | null
          size: string | null
          sku: string
          stock: number
          tire_load: string | null
          tire_speed: string | null
          tire_weight: string | null
          total_vendor_inventory: number | null
          tread_depth: string | null
          tread_type: string | null
          upc: string | null
          updated_at: string
          utqg: string | null
          vendor1_name: string | null
          vendor1_price: number | null
          vendor1_quantity: number | null
          vendor10_name: string | null
          vendor10_price: number | null
          vendor10_quantity: number | null
          vendor11_name: string | null
          vendor11_price: number | null
          vendor11_quantity: number | null
          vendor12_name: string | null
          vendor12_price: number | null
          vendor12_quantity: number | null
          vendor13_name: string | null
          vendor13_price: number | null
          vendor13_quantity: number | null
          vendor14_name: string | null
          vendor14_price: number | null
          vendor14_quantity: number | null
          vendor15_name: string | null
          vendor15_price: number | null
          vendor15_quantity: number | null
          vendor16_name: string | null
          vendor16_price: number | null
          vendor16_quantity: number | null
          vendor17_name: string | null
          vendor17_price: number | null
          vendor17_quantity: number | null
          vendor18_name: string | null
          vendor18_price: number | null
          vendor18_quantity: number | null
          vendor19_name: string | null
          vendor19_price: number | null
          vendor19_quantity: number | null
          vendor2_name: string | null
          vendor2_price: number | null
          vendor2_quantity: number | null
          vendor20_name: string | null
          vendor20_price: number | null
          vendor20_quantity: number | null
          vendor21_name: string | null
          vendor21_price: number | null
          vendor21_quantity: number | null
          vendor3_name: string | null
          vendor3_price: number | null
          vendor3_quantity: number | null
          vendor4_name: string | null
          vendor4_price: number | null
          vendor4_quantity: number | null
          vendor5_name: string | null
          vendor5_price: number | null
          vendor5_quantity: number | null
          vendor6_name: string | null
          vendor6_price: number | null
          vendor6_quantity: number | null
          vendor7_name: string | null
          vendor7_price: number | null
          vendor7_quantity: number | null
          vendor8_name: string | null
          vendor8_price: number | null
          vendor8_quantity: number | null
          vendor9_name: string | null
          vendor9_price: number | null
          vendor9_quantity: number | null
          warranty: string | null
          wholesale_price: number | null
        }
        Insert: {
          aspect?: string | null
          base_ge_sku?: string | null
          brand?: string | null
          brand_logo?: string | null
          category?: string
          created_at?: string
          description?: string | null
          features_and_benefits?: string | null
          id?: string
          images?: string | null
          item_name?: string | null
          manufacturer_product_code?: string | null
          master_brand_id?: string | null
          master_model_id?: string | null
          max_inflation_press?: string | null
          max_load?: string | null
          meas_rim_width?: string | null
          model?: string | null
          mtlid?: string | null
          name: string
          overall_diam?: string | null
          p_metric?: string | null
          ply?: string | null
          ply_rating?: string | null
          price?: number
          raw_size?: string | null
          revs_per_mile?: string | null
          rim?: string | null
          rim_width_max?: string | null
          rim_width_min?: string | null
          rim_width_range?: string | null
          run_flat?: string | null
          section?: string | null
          sidewall_abr?: string | null
          size?: string | null
          sku: string
          stock?: number
          tire_load?: string | null
          tire_speed?: string | null
          tire_weight?: string | null
          total_vendor_inventory?: number | null
          tread_depth?: string | null
          tread_type?: string | null
          upc?: string | null
          updated_at?: string
          utqg?: string | null
          vendor1_name?: string | null
          vendor1_price?: number | null
          vendor1_quantity?: number | null
          vendor10_name?: string | null
          vendor10_price?: number | null
          vendor10_quantity?: number | null
          vendor11_name?: string | null
          vendor11_price?: number | null
          vendor11_quantity?: number | null
          vendor12_name?: string | null
          vendor12_price?: number | null
          vendor12_quantity?: number | null
          vendor13_name?: string | null
          vendor13_price?: number | null
          vendor13_quantity?: number | null
          vendor14_name?: string | null
          vendor14_price?: number | null
          vendor14_quantity?: number | null
          vendor15_name?: string | null
          vendor15_price?: number | null
          vendor15_quantity?: number | null
          vendor16_name?: string | null
          vendor16_price?: number | null
          vendor16_quantity?: number | null
          vendor17_name?: string | null
          vendor17_price?: number | null
          vendor17_quantity?: number | null
          vendor18_name?: string | null
          vendor18_price?: number | null
          vendor18_quantity?: number | null
          vendor19_name?: string | null
          vendor19_price?: number | null
          vendor19_quantity?: number | null
          vendor2_name?: string | null
          vendor2_price?: number | null
          vendor2_quantity?: number | null
          vendor20_name?: string | null
          vendor20_price?: number | null
          vendor20_quantity?: number | null
          vendor21_name?: string | null
          vendor21_price?: number | null
          vendor21_quantity?: number | null
          vendor3_name?: string | null
          vendor3_price?: number | null
          vendor3_quantity?: number | null
          vendor4_name?: string | null
          vendor4_price?: number | null
          vendor4_quantity?: number | null
          vendor5_name?: string | null
          vendor5_price?: number | null
          vendor5_quantity?: number | null
          vendor6_name?: string | null
          vendor6_price?: number | null
          vendor6_quantity?: number | null
          vendor7_name?: string | null
          vendor7_price?: number | null
          vendor7_quantity?: number | null
          vendor8_name?: string | null
          vendor8_price?: number | null
          vendor8_quantity?: number | null
          vendor9_name?: string | null
          vendor9_price?: number | null
          vendor9_quantity?: number | null
          warranty?: string | null
          wholesale_price?: number | null
        }
        Update: {
          aspect?: string | null
          base_ge_sku?: string | null
          brand?: string | null
          brand_logo?: string | null
          category?: string
          created_at?: string
          description?: string | null
          features_and_benefits?: string | null
          id?: string
          images?: string | null
          item_name?: string | null
          manufacturer_product_code?: string | null
          master_brand_id?: string | null
          master_model_id?: string | null
          max_inflation_press?: string | null
          max_load?: string | null
          meas_rim_width?: string | null
          model?: string | null
          mtlid?: string | null
          name?: string
          overall_diam?: string | null
          p_metric?: string | null
          ply?: string | null
          ply_rating?: string | null
          price?: number
          raw_size?: string | null
          revs_per_mile?: string | null
          rim?: string | null
          rim_width_max?: string | null
          rim_width_min?: string | null
          rim_width_range?: string | null
          run_flat?: string | null
          section?: string | null
          sidewall_abr?: string | null
          size?: string | null
          sku?: string
          stock?: number
          tire_load?: string | null
          tire_speed?: string | null
          tire_weight?: string | null
          total_vendor_inventory?: number | null
          tread_depth?: string | null
          tread_type?: string | null
          upc?: string | null
          updated_at?: string
          utqg?: string | null
          vendor1_name?: string | null
          vendor1_price?: number | null
          vendor1_quantity?: number | null
          vendor10_name?: string | null
          vendor10_price?: number | null
          vendor10_quantity?: number | null
          vendor11_name?: string | null
          vendor11_price?: number | null
          vendor11_quantity?: number | null
          vendor12_name?: string | null
          vendor12_price?: number | null
          vendor12_quantity?: number | null
          vendor13_name?: string | null
          vendor13_price?: number | null
          vendor13_quantity?: number | null
          vendor14_name?: string | null
          vendor14_price?: number | null
          vendor14_quantity?: number | null
          vendor15_name?: string | null
          vendor15_price?: number | null
          vendor15_quantity?: number | null
          vendor16_name?: string | null
          vendor16_price?: number | null
          vendor16_quantity?: number | null
          vendor17_name?: string | null
          vendor17_price?: number | null
          vendor17_quantity?: number | null
          vendor18_name?: string | null
          vendor18_price?: number | null
          vendor18_quantity?: number | null
          vendor19_name?: string | null
          vendor19_price?: number | null
          vendor19_quantity?: number | null
          vendor2_name?: string | null
          vendor2_price?: number | null
          vendor2_quantity?: number | null
          vendor20_name?: string | null
          vendor20_price?: number | null
          vendor20_quantity?: number | null
          vendor21_name?: string | null
          vendor21_price?: number | null
          vendor21_quantity?: number | null
          vendor3_name?: string | null
          vendor3_price?: number | null
          vendor3_quantity?: number | null
          vendor4_name?: string | null
          vendor4_price?: number | null
          vendor4_quantity?: number | null
          vendor5_name?: string | null
          vendor5_price?: number | null
          vendor5_quantity?: number | null
          vendor6_name?: string | null
          vendor6_price?: number | null
          vendor6_quantity?: number | null
          vendor7_name?: string | null
          vendor7_price?: number | null
          vendor7_quantity?: number | null
          vendor8_name?: string | null
          vendor8_price?: number | null
          vendor8_quantity?: number | null
          vendor9_name?: string | null
          vendor9_price?: number | null
          vendor9_quantity?: number | null
          warranty?: string | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_fitments: {
        Row: {
          body_type: string | null
          created_at: string
          drive_type: string | null
          fg_fmk: string | null
          id: string
          make: string
          model: string
          region: string | null
          submodel: string | null
          updated_at: string
          year: number
        }
        Insert: {
          body_type?: string | null
          created_at?: string
          drive_type?: string | null
          fg_fmk?: string | null
          id?: string
          make: string
          model: string
          region?: string | null
          submodel?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          body_type?: string | null
          created_at?: string
          drive_type?: string | null
          fg_fmk?: string | null
          id?: string
          make?: string
          model?: string
          region?: string | null
          submodel?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "viewer"
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
      app_role: ["admin", "manager", "viewer"],
    },
  },
} as const
