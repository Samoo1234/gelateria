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
