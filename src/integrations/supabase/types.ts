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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          emoji: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          emoji?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      fee_settings: {
        Row: {
          flat_fee: number
          id: number
          mode: string
          tier1_fee: number
          tier1_max: number
          tier2_fee: number
          tier2_max: number
          tier3_percent: number
          updated_at: string
          zero_fee_promo: boolean
        }
        Insert: {
          flat_fee?: number
          id?: number
          mode?: string
          tier1_fee?: number
          tier1_max?: number
          tier2_fee?: number
          tier2_max?: number
          tier3_percent?: number
          updated_at?: string
          zero_fee_promo?: boolean
        }
        Update: {
          flat_fee?: number
          id?: number
          mode?: string
          tier1_fee?: number
          tier1_max?: number
          tier2_fee?: number
          tier2_max?: number
          tier3_percent?: number
          updated_at?: string
          zero_fee_promo?: boolean
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allows_custom: boolean
          buyer_rider: boolean
          category_id: string | null
          created_at: string
          description: string
          display_price: number
          id: string
          local_delivery: boolean
          local_delivery_fee: number
          min_order_for_delivery: number
          pickup_available: boolean
          rating_avg: number
          rating_count: number
          seller_price: number
          service_fee: number
          shop_id: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allows_custom?: boolean
          buyer_rider?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          display_price?: number
          id?: string
          local_delivery?: boolean
          local_delivery_fee?: number
          min_order_for_delivery?: number
          pickup_available?: boolean
          rating_avg?: number
          rating_count?: number
          seller_price: number
          service_fee?: number
          shop_id: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allows_custom?: boolean
          buyer_rider?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          display_price?: number
          id?: string
          local_delivery?: boolean
          local_delivery_fee?: number
          min_order_for_delivery?: number
          pickup_available?: boolean
          rating_avg?: number
          rating_count?: number
          seller_price?: number
          service_fee?: number
          shop_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_area: string | null
          full_name: string | null
          id: string
          language: string
          low_data_mode: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_area?: string | null
          full_name?: string | null
          id: string
          language?: string
          low_data_mode?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_area?: string | null
          full_name?: string | null
          id?: string
          language?: string
          low_data_mode?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seller_verifications: {
        Row: {
          created_at: string
          date_of_birth: string
          guardian_consent: boolean
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id_document_path: string
          id_type: string
          legal_name: string
          owner_id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          guardian_consent?: boolean
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id_document_path: string
          id_type: string
          legal_name: string
          owner_id: string
          shop_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          guardian_consent?: boolean
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id_document_path?: string
          id_type?: string
          legal_name?: string
          owner_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_verifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          bio: string | null
          campus: string | null
          city: string | null
          created_at: string
          id: string
          instagram: string | null
          is_fast_responder: boolean
          is_minor: boolean
          logo_url: string | null
          name: string
          owner_id: string
          rating_avg: number
          rating_count: number
          sales_count: number
          slug: string
          status: Database["public"]["Enums"]["shop_status"]
          tiktok: string | null
          updated_at: string
          vacation_mode: boolean
        }
        Insert: {
          bio?: string | null
          campus?: string | null
          city?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_fast_responder?: boolean
          is_minor?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          slug: string
          status?: Database["public"]["Enums"]["shop_status"]
          tiktok?: string | null
          updated_at?: string
          vacation_mode?: boolean
        }
        Update: {
          bio?: string | null
          campus?: string | null
          city?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_fast_responder?: boolean
          is_minor?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["shop_status"]
          tiktok?: string | null
          updated_at?: string
          vacation_mode?: boolean
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      wishlists: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_service_fee: { Args: { p: number }; Returns: number }
      contains_contact_info: { Args: { t: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_shop: { Args: { _shop: string }; Returns: boolean }
      record_product_view: { Args: { _product: string }; Returns: undefined }
      search_products: {
        Args: {
          campus_q?: string
          cat?: string
          lim?: number
          max_price?: number
          min_price?: number
          min_rating?: number
          off?: number
          q?: string
          sort?: string
        }
        Returns: {
          campus: string
          category_slug: string
          created_at: string
          display_price: number
          id: string
          image_url: string
          rating_avg: number
          rating_count: number
          shop_name: string
          shop_slug: string
          slug: string
          stock: number
          title: string
        }[]
      }
      shop_is_live: { Args: { _shop: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "buyer"
        | "seller"
        | "admin"
        | "moderator"
        | "finance"
        | "support"
      product_status: "pending_review" | "active" | "hidden" | "rejected"
      shop_status: "pending" | "approved" | "rejected" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["buyer", "seller", "admin", "moderator", "finance", "support"],
      product_status: ["pending_review", "active", "hidden", "rejected"],
      shop_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
