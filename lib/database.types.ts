// Database types generated from Supabase schema for Gelato Manager V2

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UnitType = 'kg' | 'g' | 'L' | 'ml' | 'un';
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
export type EmployeeStatus = 'Active' | 'Inactive';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type SaleType = 'WEIGHT' | 'SCOOP' | 'UNIT' | 'COMBO' | 'ADDON';
export type TubStatus = 'PREPARING' | 'AVAILABLE' | 'IN_USE' | 'LOW' | 'EMPTY' | 'CLEANING' | 'INACTIVE';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'VALE_REFEICAO' | 'OUTRO';

export type Database = {
  public: {
    Tables: {
      atividade_heartbeat: {
        Row: {
          data_hora: string | null
          id: number
        }
        Insert: {
          data_hora?: string | null
          id?: number
        }
        Update: {
          data_hora?: string | null
          id?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          employee_id: string | null
          entity: string
          entity_id: string | null
          id: string
          terminal_code: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          employee_id?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          terminal_code?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          employee_id?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          terminal_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string | null
          employee_id: string | null
          id: string
          movement_type: string
          reason: string
          session_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          employee_id?: string | null
          id?: string
          movement_type: string
          reason: string
          session_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          employee_id?: string | null
          id?: string
          movement_type?: string
          reason?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_sessions: {
        Row: {
          closed_at: string | null
          closing_actual_amount: number | null
          closing_expected_amount: number | null
          created_at: string | null
          difference: number | null
          employee_id: string | null
          id: string
          initial_amount: number
          notes: string | null
          opened_at: string | null
          status: string | null
          terminal_id: string | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          closing_actual_amount?: number | null
          closing_expected_amount?: number | null
          created_at?: string | null
          difference?: number | null
          employee_id?: string | null
          id?: string
          initial_amount?: number
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          terminal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          closing_actual_amount?: number | null
          closing_expected_amount?: number | null
          created_at?: string | null
          difference?: number | null
          employee_id?: string | null
          id?: string
          initial_amount?: number
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          terminal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      containers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sale_type: string
          scoop_capacity: number | null
          tare_weight: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sale_type?: string
          scoop_capacity?: number | null
          tare_weight?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sale_type?: string
          scoop_capacity?: number | null
          tare_weight?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string | null
          hire_date: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          pin_code: string | null
          role: string | null
          salary: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pin_code?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pin_code?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ingredient_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          category_id: string | null
          cost_per_unit: number
          created_at: string | null
          current_stock: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          min_stock: number | null
          name: string
          supplier_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost_per_unit?: number
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          min_stock?: number | null
          name: string
          supplier_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost_per_unit?: number
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          min_stock?: number | null
          name?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          employee_id: string | null
          id: string
          ingredient_id: string | null
          movement_date: string | null
          movement_type: string
          notes: string | null
          quantity: number
          reason: string | null
          total_cost: number | null
          unit: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          ingredient_id?: string | null
          movement_date?: string | null
          movement_type: string
          notes?: string | null
          quantity: number
          reason?: string | null
          total_cost?: number | null
          unit: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          ingredient_id?: string | null
          movement_date?: string | null
          movement_type?: string
          notes?: string | null
          quantity?: number
          reason?: string | null
          total_cost?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          container_id: string | null
          created_at: string | null
          gross_weight: number | null
          id: string
          net_weight: number | null
          notes: string | null
          options: Json | null
          order_id: string | null
          product_id: string | null
          quantity: number
          sale_type: string | null
          subtotal: number
          tare_weight: number | null
          unit_cost: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          container_id?: string | null
          created_at?: string | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          notes?: string | null
          options?: Json | null
          order_id?: string | null
          product_id?: string | null
          quantity: number
          sale_type?: string | null
          subtotal: number
          tare_weight?: number | null
          unit_cost?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          container_id?: string | null
          created_at?: string | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          notes?: string | null
          options?: Json | null
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          sale_type?: string | null
          subtotal?: number
          tare_weight?: number | null
          unit_cost?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          change_amount: number | null
          created_at: string | null
          id: string
          order_id: string
          payment_method: string
        }
        Insert: {
          amount: number
          change_amount?: number | null
          created_at?: string | null
          id?: string
          order_id: string
          payment_method: string
        }
        Update: {
          amount?: number
          change_amount?: number | null
          created_at?: string | null
          id?: string
          order_id?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount: number | null
          employee_id: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string | null
          payment_method: string | null
          session_id: string | null
          status: string | null
          subtotal: number | null
          terminal_id: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          payment_method?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          terminal_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          payment_method?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          terminal_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_flavor: boolean | null
          name: string
          price: number
          sale_type: string | null
          stock_trackable: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_flavor?: boolean | null
          name: string
          price?: number
          sale_type?: string | null
          stock_trackable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_flavor?: boolean | null
          name?: string
          price?: number
          sale_type?: string | null
          stock_trackable?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          cost: number | null
          created_at: string | null
          display_order: number | null
          id: string
          ingredient_id: string | null
          quantity: number
          recipe_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          ingredient_id?: string | null
          quantity: number
          recipe_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          ingredient_id?: string | null
          quantity?: number
          recipe_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          prep_time: number | null
          product_id: string | null
          total_cost: number | null
          updated_at: string | null
          yield: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          prep_time?: number | null
          product_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          yield?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          prep_time?: number | null
          product_id?: string | null
          total_cost?: number | null
          updated_at?: string | null
          yield?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          data_type: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      terminals: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      tubs: {
        Row: {
          capacity_kg: number | null
          code: string
          created_at: string | null
          current_weight_kg: number | null
          flavor_product_id: string | null
          id: string
          qr_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity_kg?: number | null
          code: string
          created_at?: string | null
          current_weight_kg?: number | null
          flavor_product_id?: string | null
          id?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity_kg?: number | null
          code?: string
          created_at?: string | null
          current_weight_kg?: number | null
          flavor_product_id?: string | null
          id?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tubs_flavor_product_id_fkey"
            columns: ["flavor_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_low_stock_ingredients: {
        Row: {
          category_name: string | null
          current_stock: number | null
          id: string | null
          min_stock: number | null
          name: string | null
          supplier_email: string | null
          supplier_name: string | null
          supplier_phone: string | null
          unit: string | null
        }
        Relationships: []
      }
      v_products_with_cost: {
        Row: {
          category_name: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          margin_percentage: number | null
          name: string | null
          price: number | null
          profit: number | null
          recipe_id: string | null
          total_cost: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_recipes_detailed: {
        Row: {
          ingredients: Json | null
          prep_time: number | null
          product_id: string | null
          product_name: string | null
          recipe_id: string | null
          total_cost: number | null
          yield: number | null
        }
        Relationships: []
      }
      v_sales_statistics: {
        Row: {
          average_order_value: number | null
          sale_date: string | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      finalize_sale: { Args: { p_sale_payload: Json }; Returns: Json }
      get_product_cost: { Args: { p_product_id: string }; Returns: number }
      get_product_margin: { Args: { p_product_id: string }; Returns: number }
      reset_atividade_heartbeat: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
