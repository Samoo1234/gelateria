export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  recipeId?: string;
  cost?: number;
  margin?: number; // Margem de lucro em %
  profitMargin?: number; // Lucro unitário em R$
}

export interface CartItem extends Product {
  quantity: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: string; // e.g., "50 L"
  status: 'In Stock' | 'Low Stock' | 'Critical';
  lastUpdated: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface SalesData {
  time: string;
  sales: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  color: string;
}

// Costing System Types
export type UnitType = 'kg' | 'g' | 'L' | 'ml' | 'un';

export interface Ingredient {
  id: string;
  name: string;
  category: 'Laticínios' | 'Frutas/Polpas' | 'Secos' | 'Químicos' | 'Embalagens' | 'Outros';
  unit: UnitType;
  costPerUnit: number; // Custo por unidade (ex: R$/kg, R$/L)
  supplier?: string;
  lastUpdated?: string;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName?: string; // Para facilitar a exibição
  quantity: number;
  unit: UnitType;
  cost?: number; // Custo calculado deste item
}

export interface Recipe {
  id: string;
  productId: string;
  productName?: string;
  items: RecipeItem[];
  yield: number; // Rendimento (quantas unidades produz)
  prepTime?: number; // Tempo de preparo em minutos
  totalCost?: number; // Custo total calculado
  createdAt?: string;
  updatedAt?: string;
}

export interface CostBreakdown {
  ingredients: number;
  packaging?: number;
  labor?: number;
  overhead?: number;
  total: number;
}

// Technical Formulation Types
export type DataStatus = 'CONFIRMED' | 'ESTIMATED' | 'MISSING';
export type RecipeType = 'MANUFACTURING' | 'COMMERCIAL_ASSEMBLY';
export type BaseType = 'MILK' | 'WATER' | 'NEUTRAL';
export type RecipeStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED';

export interface IngredientTechnicalProfile {
  id?: string;
  ingredient_id: string;
  water_pct: number;
  total_solids_pct: number;
  fat_pct: number;
  msnf_pct: number; // ESDL
  lactose_pct: number;
  sucrose_pct: number;
  other_sugars_pct: number;
  pod_factor: number; // sacarose = 1.0
  pac_factor: number; // sacarose = 1.0
  density_g_ml: number;
  is_mix_ingredient: boolean;
  data_status: DataStatus;
  source?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormulationIngredientItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number; // na unidade escolhida
  unit: UnitType;
  costPerUnit: number;
  isClosingIngredient?: boolean;
  profile?: IngredientTechnicalProfile | null;
}

export interface FormulationCalculatedMetrics {
  totalMassG: number;
  totalFatG: number;
  fatPct: number;
  totalMsnfG: number;
  msnfPct: number;
  totalSugarG: number;
  sugarPct: number;
  totalSolidsG: number;
  totalSolidsPct: number;
  waterPct: number;
  pod: number; // Poder Edulcorante por 100g da mistura
  pac: number; // Poder Anticongelante por 100g da mistura
  costTotal: number;
  costPerKg: number;
  missingFactors: { ingredientName: string; missingProperties: string[] }[];
  isBalanced: boolean;
}

export interface FormulationTargets {
  targetWeightG: number;
  fatPct?: { target: number; tolerance: number };
  msnfPct?: { target: number; tolerance: number };
  sugarPct?: { target: number; tolerance: number };
  totalSolidsPct?: { target: number; tolerance: number };
  pod?: { target: number; tolerance: number };
  pac?: { target: number; tolerance: number };
}

export interface TargetDiagnostic {
  parameter: string;
  target: number;
  actual: number;
  deviation: number;
  tolerance: number;
  isWithinTolerance: boolean;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'OUT_OF_BOUNDS';
}

export interface PricingMetrics {
  cost: number;
  price: number;
  multiplier: number; // Preço / Custo (ex: 6.6x)
  markupPct: number; // (Preço - Custo) / Custo * 100
  marginPct: number; // (Preço - Custo) / Preço * 100
  profit: number; // Preço - Custo
}
