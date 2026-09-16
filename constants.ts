import { Product, InventoryItem, Employee, SalesData, TopProduct, Ingredient, Recipe } from './types';

export const CATEGORIES = ['Casquinha', 'Copo', 'Açaí', 'Milkshake', 'Bebidas'];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Chocolate',
    price: 5.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg0S42gjv_ihRfsQxQDIbE8_qMUqo5EUQHkpdbc1XxsnenutvynZD8dyX6C6bM_z9YyVQb4UeP5NtOTg15wCCAjMOA9qx99fMcSKBtmQfJe75p8rGyFhZbgC6dfBPZqtUwvyhv4ao7p-WfaZfWMIPNC3mEl934YsR_ZqqhHZ5cndbsS07M7Qr-Kd3pro93DnbYZs5Ls2grD_JJkmD96LufazoFxnX-4FsPLAI06M4GxEp_FbOZ5fGBZlW0rXYURFPAyHygb3JA0Bc'
  },
  {
    id: '2',
    name: 'Morango',
    price: 5.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVhvhETRkoMpZ8ZMvZiZCd7h0PdMdSXR1wkwViYL2HSkycLlyJF1kY0Gq6jGqofT2ySO9NOKohM00YdBBztihZyYKhcFXFSfWsNMSli9oIUsihKrcS-ueP6pECly4D62Lf2RqJhw2A0642AaAdLn7D3DQSMyFWwZbqsDYvAZb-d4d66sDYRnAZ3tXhByLxYFSqbDCtXaZ65FC49csl-yoHz7RnN2G07jX-pgwDzEZHLDDFmblKpx_JNX0jejUxMx43W71oGrUegqE'
  },
  {
    id: '3',
    name: 'Creme',
    price: 5.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz2EwyP9dAq39XxZEPeJN5sMgf5DqivvahzdyvibAmoAd-ZnVzMRJoAo3MJ4xfGHH8F1eBSFksxrRF2o1BwwqpdtPP6YmgtU3lTRN5Bu98E_gMDJ4yYrZ6-7y1hPFJNR48fHVupVzNIPJWrjui6Rhq7KpSzYia1h36MmMrIULyODqGjioSxiNvZJPMVU3PfdR0FsXnazN0J6aWla0C1fO9W97ym1X_hsCgcprg1JL8mPeq5eqSxV5wpxWRc-X2_MxpKx_pfCwyQVU'
  },
  {
    id: '4',
    name: 'Flocos',
    price: 5.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKKcySIVwsoo2QLK5U3avRlQx1Id6yQ0ENiS15RzPEgVYFE_rGIPUo0L1PCYVGf73wWwu7p-k2mF4drhzfS_-ADonYCx969TNMz5KtndGdKbpD2uXDfda1AONeIS9vkG3EKO4EM7_nv4uaQoM7wSnHhDQQn-Qr9_M1EIVIdffihYabnx9nBdnSNEr2PSNPXgpq7M4bxEXIL-YcfPHCaa1jcScAdluQDwaxOG-G6lyTxx36xlbSsGvCTScyiW5gG-K0SZS9luy8FuM'
  },
  {
    id: '5',
    name: 'Pistache',
    price: 6.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNzDGeuGOLVE2WpgwVFAP9RJ5TfsL0lZcpLLvWhAF0NrHJJqsYutntwZebRIvCmjnr_e6aSjDXQt-EOd1WXciCQDKdZTnn-eFmHjTOKbukuvYzHoOw4_9I12gh-b8_xmGJpzLF8hazn3nOql4gGSbUf4VAc9gsxULqaAJUm7ENJj5HV0Boj_bl_VyM8TsfL9D1LFzl_VXp18WUtaTJYfbN0ECrh9xvmHVHrlp-BxAx9x6CukYV3ARbZ-VpYjcvI1-cmjzAYgxvL8U'
  },
  {
    id: '6',
    name: 'Doce de Leite',
    price: 6.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRjOZuRf3MqKvX4hEPjFerhBMZx9e8TcKvJtWtVV0Pvd2_3fbRnN2Hdf1jj1hr1S9FJC0WABCGd0nFQHOX6qhauD22FWsLYlI2SlRUJmkNWIFB6C_0lXUM5qWAjV6dhbZ6UoglEDl0bmxiEI6Kdmbef9odAvDsNA03kf7678w1Z4G_Bg_C2j5Dds75mmR4De4JTA6S8AI4I6Xy8iFZKki0wQMyE4fGWIkzzB0QEzkFDopHo_0jqwOP07LQQwc4EvIrN9M5L9MiCns'
  },
  {
    id: '7',
    name: 'Menta',
    price: 6.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsBo5vqCeDnANjJGBWj-9-2o3GzsZCkMjogYFnCs8dmqzMiGTbTt3AkRo2y0VFJmVtk7tfN7bkB4LQjjkzvzEJW9hVmNAuqyL-FEOeBYbVdv-aMt_bOAWq2EN9n4edLhq2ZYFbA11QVPuyQUrrASg2sKK-yvRHe_oBysX6Ho3smlAWgHby_n7VYtHGhF6j08sGV7cyT38LQMEUSPgizK70fiqQYZaGo2bnDWI2FUI4sUUnvl_IyvyK-0JJdKXveRN3bHHi6rJRzCY'
  },
  {
    id: '8',
    name: 'Limão',
    price: 5.00,
    category: 'Casquinha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBu6uaUY4s1zmAhKdJ0C-yOnSJTMP0lBNDnjuQshYuqGIIyWB6TiGWnHwsG1Jkjuc7quGfZbyCDXJcQ60PhowA3JyzR81HNxevX2YvmIeGq4O5JItixt_CumMl5AHwzM5n0CwjikAIQWAVCxQBg5XFWl0F68Esa8H-YZp8ftMf338ptSzPrsK_ow0E7-rd9Q-ZwA1UhF02eBq4Gq3-lCEsCbRiVlW29Unkbeh1f5xNq2wStvVGMs3Hi9C4x1bk31ANrkKZ8p5Guts0'
  },
  {
    id: '9',
    name: 'Açaí 300ml',
    price: 12.00,
    category: 'Açaí',
    image: 'https://picsum.photos/200/200?random=9'
  },
  {
    id: '10',
    name: 'Açaí 500ml',
    price: 18.00,
    category: 'Açaí',
    image: 'https://picsum.photos/200/200?random=10'
  },
];

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Leite Integral', category: 'Laticínios', quantity: '50 L', status: 'In Stock', lastUpdated: '24/05/2024' },
  { id: '2', name: 'Açúcar Refinado', category: 'Secos', quantity: '15 Kg', status: 'Low Stock', lastUpdated: '23/05/2024' },
  { id: '3', name: 'Polpa de Morango', category: 'Frutas', quantity: '5 Kg', status: 'Critical', lastUpdated: '20/05/2024' },
  { id: '4', name: 'Chocolate em Pó 50%', category: 'Secos', quantity: '35 Kg', status: 'In Stock', lastUpdated: '24/05/2024' },
  { id: '5', name: 'Emulsificante', category: 'Químicos', quantity: '8 Kg', status: 'In Stock', lastUpdated: '22/05/2024' },
];

export const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Ana Silva', role: 'Gerente', email: 'ana.silva@sorveteria.com', status: 'Active' },
  { id: '2', name: 'Bruno Costa', role: 'Caixa', email: 'bruno.costa@sorveteria.com', status: 'Active' },
  { id: '3', name: 'Carla Dias', role: 'Estoquista', email: 'carla.dias@sorveteria.com', status: 'Inactive' },
];

export const HOURLY_SALES: SalesData[] = [
  { time: '09h', sales: 400 },
  { time: '11h', sales: 600 },
  { time: '13h', sales: 300 },
  { time: '15h', sales: 1200 },
  { time: '17h', sales: 900 },
  { time: '19h', sales: 1100 },
  { time: '21h', sales: 800 },
];

export const PERIOD_SALES: SalesData[] = [
  { time: 'Seg', sales: 1200 },
  { time: 'Ter', sales: 1500 },
  { time: 'Qua', sales: 1100 },
  { time: 'Qui', sales: 1800 },
  { time: 'Sex', sales: 2400 },
  { time: 'Sab', sales: 3200 },
  { time: 'Dom', sales: 2800 },
];

export const TOP_PRODUCTS: TopProduct[] = [
  { name: 'Chocolate Belga', sales: 87, color: '#3b82f6' },
  { name: 'Morango com Nutella', sales: 71, color: '#fca5a5' },
  { name: 'Açaí 500ml', sales: 65, color: '#c084fc' },
  { name: 'Pistache', sales: 58, color: '#86efac' },
  { name: 'Ninho Trufado', sales: 49, color: '#fcd34d' },
];

// Costing System Data
export const INGREDIENTS: Ingredient[] = [
  // Laticínios
  { id: 'ing-1', name: 'Leite Integral', category: 'Laticínios', unit: 'L', costPerUnit: 5.00, supplier: 'Laticínio Fazenda', lastUpdated: '2024-11-25' },
  { id: 'ing-2', name: 'Creme de Leite', category: 'Laticínios', unit: 'L', costPerUnit: 8.50, supplier: 'Laticínio Fazenda', lastUpdated: '2024-11-25' },
  { id: 'ing-3', name: 'Leite Condensado', category: 'Laticínios', unit: 'kg', costPerUnit: 12.00, supplier: 'Distribuidora Alimentos', lastUpdated: '2024-11-20' },

  // Frutas e Polpas
  { id: 'ing-4', name: 'Polpa de Morango', category: 'Frutas/Polpas', unit: 'kg', costPerUnit: 18.00, supplier: 'Frutas Tropicais Ltda', lastUpdated: '2024-11-22' },
  { id: 'ing-5', name: 'Polpa de Limão', category: 'Frutas/Polpas', unit: 'kg', costPerUnit: 15.00, supplier: 'Frutas Tropicais Ltda', lastUpdated: '2024-11-22' },
  { id: 'ing-6', name: 'Polpa de Açaí', category: 'Frutas/Polpas', unit: 'kg', costPerUnit: 25.00, supplier: 'Açaí da Amazônia', lastUpdated: '2024-11-18' },

  // Secos
  { id: 'ing-7', name: 'Açúcar Refinado', category: 'Secos', unit: 'kg', costPerUnit: 4.50, supplier: 'Atacado Alimentos', lastUpdated: '2024-11-28' },
  { id: 'ing-8', name: 'Chocolate em Pó 50%', category: 'Secos', unit: 'kg', costPerUnit: 35.00, supplier: 'Chocolates Premium', lastUpdated: '2024-11-15' },
  { id: 'ing-9', name: 'Cacau em Pó', category: 'Secos', unit: 'kg', costPerUnit: 45.00, supplier: 'Chocolates Premium', lastUpdated: '2024-11-15' },
  { id: 'ing-10', name: 'Pasta de Pistache', category: 'Secos', unit: 'kg', costPerUnit: 120.00, supplier: 'Importadora Nuts', lastUpdated: '2024-11-10' },
  { id: 'ing-11', name: 'Flocos de Arroz', category: 'Secos', unit: 'kg', costPerUnit: 18.00, supplier: 'Atacado Alimentos', lastUpdated: '2024-11-20' },
  { id: 'ing-12', name: 'Essência de Baunilha', category: 'Secos', unit: 'ml', costPerUnit: 0.80, supplier: 'Aromas & Sabores', lastUpdated: '2024-11-12' },
  { id: 'ing-13', name: 'Essência de Menta', category: 'Secos', unit: 'ml', costPerUnit: 0.60, supplier: 'Aromas & Sabores', lastUpdated: '2024-11-12' },

  // Químicos
  { id: 'ing-14', name: 'Emulsificante', category: 'Químicos', unit: 'kg', costPerUnit: 28.00, supplier: 'Química Industrial', lastUpdated: '2024-11-18' },
  { id: 'ing-15', name: 'Estabilizante', category: 'Químicos', unit: 'kg', costPerUnit: 32.00, supplier: 'Química Industrial', lastUpdated: '2024-11-18' },

  // Embalagens
  { id: 'ing-16', name: 'Casquinha Pequena', category: 'Embalagens', unit: 'un', costPerUnit: 0.35, supplier: 'Embalagens Express', lastUpdated: '2024-11-25' },
  { id: 'ing-17', name: 'Copo 300ml', category: 'Embalagens', unit: 'un', costPerUnit: 0.25, supplier: 'Embalagens Express', lastUpdated: '2024-11-25' },
  { id: 'ing-18', name: 'Copo 500ml', category: 'Embalagens', unit: 'un', costPerUnit: 0.40, supplier: 'Embalagens Express', lastUpdated: '2024-11-25' },
  { id: 'ing-19', name: 'Colher Descartável', category: 'Embalagens', unit: 'un', costPerUnit: 0.05, supplier: 'Embalagens Express', lastUpdated: '2024-11-25' },
];

export const RECIPES: Recipe[] = [
  // Casquinha de Chocolate
  {
    id: 'rec-1',
    productId: '1',
    productName: 'Chocolate',
    items: [
      { ingredientId: 'ing-1', ingredientName: 'Leite Integral', quantity: 0.1, unit: 'L', cost: 0.50 },
      { ingredientId: 'ing-8', ingredientName: 'Chocolate em Pó 50%', quantity: 0.05, unit: 'kg', cost: 1.75 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.03, unit: 'kg', cost: 0.14 },
      { ingredientId: 'ing-14', ingredientName: 'Emulsificante', quantity: 0.01, unit: 'kg', cost: 0.28 },
      { ingredientId: 'ing-16', ingredientName: 'Casquinha Pequena', quantity: 1, unit: 'un', cost: 0.35 },
    ],
    yield: 1,
    prepTime: 5,
    totalCost: 3.02,
    createdAt: '2024-11-20',
    updatedAt: '2024-11-25',
  },
  // Casquinha de Morango
  {
    id: 'rec-2',
    productId: '2',
    productName: 'Morango',
    items: [
      { ingredientId: 'ing-1', ingredientName: 'Leite Integral', quantity: 0.08, unit: 'L', cost: 0.40 },
      { ingredientId: 'ing-4', ingredientName: 'Polpa de Morango', quantity: 0.06, unit: 'kg', cost: 1.08 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.03, unit: 'kg', cost: 0.14 },
      { ingredientId: 'ing-14', ingredientName: 'Emulsificante', quantity: 0.01, unit: 'kg', cost: 0.28 },
      { ingredientId: 'ing-16', ingredientName: 'Casquinha Pequena', quantity: 1, unit: 'un', cost: 0.35 },
    ],
    yield: 1,
    prepTime: 5,
    totalCost: 2.25,
    createdAt: '2024-11-20',
    updatedAt: '2024-11-24',
  },
  // Casquinha de Creme
  {
    id: 'rec-3',
    productId: '3',
    productName: 'Creme',
    items: [
      { ingredientId: 'ing-1', ingredientName: 'Leite Integral', quantity: 0.08, unit: 'L', cost: 0.40 },
      { ingredientId: 'ing-2', ingredientName: 'Creme de Leite', quantity: 0.04, unit: 'L', cost: 0.34 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.03, unit: 'kg', cost: 0.14 },
      { ingredientId: 'ing-12', ingredientName: 'Essência de Baunilha', quantity: 2, unit: 'ml', cost: 1.60 },
      { ingredientId: 'ing-14', ingredientName: 'Emulsificante', quantity: 0.01, unit: 'kg', cost: 0.28 },
      { ingredientId: 'ing-16', ingredientName: 'Casquinha Pequena', quantity: 1, unit: 'un', cost: 0.35 },
    ],
    yield: 1,
    prepTime: 5,
    totalCost: 3.11,
    createdAt: '2024-11-21',
    updatedAt: '2024-11-25',
  },
  // Pistache
  {
    id: 'rec-5',
    productId: '5',
    productName: 'Pistache',
    items: [
      { ingredientId: 'ing-1', ingredientName: 'Leite Integral', quantity: 0.08, unit: 'L', cost: 0.40 },
      { ingredientId: 'ing-10', ingredientName: 'Pasta de Pistache', quantity: 0.03, unit: 'kg', cost: 3.60 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.025, unit: 'kg', cost: 0.11 },
      { ingredientId: 'ing-14', ingredientName: 'Emulsificante', quantity: 0.01, unit: 'kg', cost: 0.28 },
      { ingredientId: 'ing-16', ingredientName: 'Casquinha Pequena', quantity: 1, unit: 'un', cost: 0.35 },
    ],
    yield: 1,
    prepTime: 6,
    totalCost: 4.74,
    createdAt: '2024-11-22',
    updatedAt: '2024-11-26',
  },
  // Açaí 300ml
  {
    id: 'rec-9',
    productId: '9',
    productName: 'Açaí 300ml',
    items: [
      { ingredientId: 'ing-6', ingredientName: 'Polpa de Açaí', quantity: 0.28, unit: 'kg', cost: 7.00 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.02, unit: 'kg', cost: 0.09 },
      { ingredientId: 'ing-15', ingredientName: 'Estabilizante', quantity: 0.005, unit: 'kg', cost: 0.16 },
      { ingredientId: 'ing-17', ingredientName: 'Copo 300ml', quantity: 1, unit: 'un', cost: 0.25 },
      { ingredientId: 'ing-19', ingredientName: 'Colher Descartável', quantity: 1, unit: 'un', cost: 0.05 },
    ],
    yield: 1,
    prepTime: 3,
    totalCost: 7.55,
    createdAt: '2024-11-23',
    updatedAt: '2024-11-27',
  },
  // Açaí 500ml
  {
    id: 'rec-10',
    productId: '10',
    productName: 'Açaí 500ml',
    items: [
      { ingredientId: 'ing-6', ingredientName: 'Polpa de Açaí', quantity: 0.46, unit: 'kg', cost: 11.50 },
      { ingredientId: 'ing-7', ingredientName: 'Açúcar Refinado', quantity: 0.03, unit: 'kg', cost: 0.14 },
      { ingredientId: 'ing-15', ingredientName: 'Estabilizante', quantity: 0.008, unit: 'kg', cost: 0.26 },
      { ingredientId: 'ing-18', ingredientName: 'Copo 500ml', quantity: 1, unit: 'un', cost: 0.40 },
      { ingredientId: 'ing-19', ingredientName: 'Colher Descartável', quantity: 1, unit: 'un', cost: 0.05 },
    ],
    yield: 1,
    prepTime: 3,
    totalCost: 12.35,
    createdAt: '2024-11-23',
    updatedAt: '2024-11-28',
  },
];