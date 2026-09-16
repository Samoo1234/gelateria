// Database types generated from Supabase schema

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

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    display_order: number;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    display_order?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    display_order?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            products: {
                Row: {
                    id: string;
                    name: string;
                    category_id: string | null;
                    price: number;
                    image_url: string | null;
                    description: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    category_id?: string | null;
                    price?: number;
                    image_url?: string | null;
                    description?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    category_id?: string | null;
                    price?: number;
                    image_url?: string | null;
                    description?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            ingredient_categories: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            ingredients: {
                Row: {
                    id: string;
                    name: string;
                    category_id: string | null;
                    unit: UnitType;
                    cost_per_unit: number;
                    supplier_id: string | null;
                    current_stock: number;
                    min_stock: number;
                    is_active: boolean;
                    last_updated: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    category_id?: string | null;
                    unit: UnitType;
                    cost_per_unit?: number;
                    supplier_id?: string | null;
                    current_stock?: number;
                    min_stock?: number;
                    is_active?: boolean;
                    last_updated?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    category_id?: string | null;
                    unit?: UnitType;
                    cost_per_unit?: number;
                    supplier_id?: string | null;
                    current_stock?: number;
                    min_stock?: number;
                    is_active?: boolean;
                    last_updated?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            recipes: {
                Row: {
                    id: string;
                    product_id: string | null;
                    yield: number;
                    prep_time: number | null;
                    total_cost: number;
                    notes: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    product_id?: string | null;
                    yield?: number;
                    prep_time?: number | null;
                    total_cost?: number;
                    notes?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    product_id?: string | null;
                    yield?: number;
                    prep_time?: number | null;
                    total_cost?: number;
                    notes?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            recipe_items: {
                Row: {
                    id: string;
                    recipe_id: string | null;
                    ingredient_id: string | null;
                    quantity: number;
                    unit: UnitType;
                    cost: number;
                    display_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    recipe_id?: string | null;
                    ingredient_id?: string | null;
                    quantity: number;
                    unit: UnitType;
                    cost?: number;
                    display_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    recipe_id?: string | null;
                    ingredient_id?: string | null;
                    quantity?: number;
                    unit?: UnitType;
                    cost?: number;
                    display_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            employees: {
                Row: {
                    id: string;
                    name: string;
                    role: string | null;
                    email: string | null;
                    phone: string | null;
                    status: EmployeeStatus;
                    hire_date: string | null;
                    salary: number | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    role?: string | null;
                    email?: string | null;
                    phone?: string | null;
                    status?: EmployeeStatus;
                    hire_date?: string | null;
                    salary?: number | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    role?: string | null;
                    email?: string | null;
                    phone?: string | null;
                    status?: EmployeeStatus;
                    hire_date?: string | null;
                    salary?: number | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            orders: {
                Row: {
                    id: string;
                    order_number: string | null;
                    customer_id: string | null;
                    employee_id: string | null;
                    order_date: string;
                    status: OrderStatus;
                    subtotal: number;
                    discount: number;
                    total: number;
                    payment_method: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    order_number?: string | null;
                    customer_id?: string | null;
                    employee_id?: string | null;
                    order_date?: string;
                    status?: OrderStatus;
                    subtotal?: number;
                    discount?: number;
                    total?: number;
                    payment_method?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    order_number?: string | null;
                    customer_id?: string | null;
                    employee_id?: string | null;
                    order_date?: string;
                    status?: OrderStatus;
                    subtotal?: number;
                    discount?: number;
                    total?: number;
                    payment_method?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            settings: {
                Row: {
                    id: string;
                    key: string;
                    value: string | null;
                    data_type: string;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key: string;
                    value?: string | null;
                    data_type?: string;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: string | null;
                    data_type?: string;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            v_products_with_cost: {
                Row: {
                    id: string;
                    name: string;
                    price: number;
                    category_name: string | null;
                    image_url: string | null;
                    recipe_id: string | null;
                    total_cost: number | null;
                    profit: number | null;
                    margin_percentage: number | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
            };
        };
        Functions: {
            get_product_cost: {
                Args: { p_product_id: string };
                Returns: number;
            };
            get_product_margin: {
                Args: { p_product_id: string };
                Returns: number;
            };
        };
    };
}
