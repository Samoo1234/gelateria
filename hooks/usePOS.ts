import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  orderService, 
  ProductRow, 
  CategoryRow, 
  ContainerRow, 
  SaleItemPayload, 
  PaymentPayload,
  FinalizeSaleResult 
} from '../services/orderService';

export interface CartItemUI {
  id: string; // client temporary ID
  productId: string;
  productName: string;
  saleType: 'UNIT' | 'WEIGHT' | 'SCOOP';
  unitPrice: number;
  quantity: number;
  containerId?: string | null;
  containerName?: string | null;
  containerPrice?: number;
  tareWeight?: number;
  grossWeight?: number;
  netWeight?: number;
  selectedFlavors?: string[];
  toppings?: string[];
  notes?: string;
  subtotal: number;
}

export function usePOS() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItemUI[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [activeCashierId, setActiveCashierId] = useState<string | null>(null);
  const [lastSaleResult, setLastSaleResult] = useState<FinalizeSaleResult | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Carregar catálogo inicial
  const loadCatalog = useCallback(async () => {
    try {
      setIsLoadingCatalog(true);
      setCatalogError(null);
      const [cats, prods, conts, terminals, cashiers] = await Promise.all([
        orderService.getCategories(),
        orderService.getProducts(),
        orderService.getContainers(),
        orderService.getTerminals(),
        orderService.getCashiers(),
      ]);

      setCategories(cats);
      setProducts(prods);
      setContainers(conts);

      if (cats.length > 0 && !activeCategoryId) {
        setActiveCategoryId(cats[0].id);
      }
      if (terminals.length > 0 && !activeTerminalId) {
        setActiveTerminalId(terminals[0].id);
      }
      if (cashiers.length > 0 && !activeCashierId) {
        setActiveCashierId(cashiers[0].id);
      }
    } catch (err: any) {
      console.error('Falha ao carregar catálogo PDV:', err);
      setCatalogError(err.message || 'Erro ao conectar com catálogo do Supabase');
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [activeCategoryId, activeTerminalId, activeCashierId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Sabores disponíveis (is_flavor = true)
  const availableFlavors = useMemo(() => {
    return products.filter(p => p.is_flavor === true);
  }, [products]);

  // Recipientes para bola (casquinhas, copos)
  const scoopContainers = useMemo(() => {
    return containers.filter(c => c.sale_type === 'SCOOP');
  }, [containers]);

  // Recipientes para peso (potes térmicos)
  const weightContainers = useMemo(() => {
    return containers.filter(c => c.sale_type === 'WEIGHT');
  }, [containers]);

  // Produtos filtrados por categoria e busca
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Se for apenas sabor e estiver na tela de sabores avulsos, ignora ou filtra
      const matchesCategory = activeCategoryId ? p.category_id === activeCategoryId : true;
      const matchesSearch = searchQuery.trim() === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategoryId, searchQuery]);

  // Adicionar produto unitário simples ao carrinho
  const addUnitProduct = useCallback((product: ProductRow) => {
    const tempId = `unit-${product.id}-${Date.now()}`;
    setCart(prev => {
      // Se já existir o mesmo produto unitário sem opções, incrementa quantidade
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.saleType === 'UNIT');
      if (existingIndex >= 0) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: Number((item.unitPrice * newQty).toFixed(2))
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: tempId,
          productId: product.id,
          productName: product.name,
          saleType: 'UNIT',
          unitPrice: Number(product.price),
          quantity: 1,
          subtotal: Number(product.price)
        }
      ];
    });
  }, []);

  // Adicionar sorvete por bola (com recipiente e sabores selecionados)
  const addScoopItem = useCallback((
    baseProduct: ProductRow,
    container: ContainerRow,
    selectedFlavors: string[],
    notes?: string
  ) => {
    const tempId = `scoop-${container.id}-${Date.now()}`;
    const scoopCount = selectedFlavors.length || 1;
    // O preço base é calculado no cliente apenas para exibição rápida; o servidor valida na RPC
    const containerPrice = Number(container.price || 0);
    const scoopUnitPrice = Number(baseProduct.price);
    const itemSubtotal = (scoopUnitPrice * scoopCount) + containerPrice;

    const newItem: CartItemUI = {
      id: tempId,
      productId: baseProduct.id,
      productName: `${container.name} (${scoopCount} ${scoopCount > 1 ? 'bolas' : 'bola'})`,
      saleType: 'SCOOP',
      unitPrice: scoopUnitPrice,
      quantity: 1,
      containerId: container.id,
      containerName: container.name,
      containerPrice,
      selectedFlavors,
      notes,
      subtotal: Number(itemSubtotal.toFixed(2))
    };

    setCart(prev => [...prev, newItem]);
  }, []);

  // Adicionar produto por peso (balança / tara)
  const addWeightItem = useCallback((
    product: ProductRow,
    container: ContainerRow,
    grossWeightKg: number,
    notes?: string
  ) => {
    const tempId = `weight-${product.id}-${Date.now()}`;
    const tareWeightKg = Number(container.tare_weight || 0);
    const netWeightKg = Math.max(0, Number((grossWeightKg - tareWeightKg).toFixed(3)));
    const pricePerKg = Number(product.price);
    const subtotal = Number((netWeightKg * pricePerKg).toFixed(2));

    const newItem: CartItemUI = {
      id: tempId,
      productId: product.id,
      productName: `${product.name} [${container.name}]`,
      saleType: 'WEIGHT',
      unitPrice: pricePerKg,
      quantity: 1,
      containerId: container.id,
      containerName: container.name,
      tareWeight: tareWeightKg,
      grossWeight: grossWeightKg,
      netWeight: netWeightKg,
      notes,
      subtotal
    };

    setCart(prev => [...prev, newItem]);
  }, []);

  // Atualizar quantidade de um item
  const updateItemQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        if (item.saleType === 'WEIGHT') return item; // Peso não altera quantidade unitária simples
        const newQty = Math.max(1, item.quantity + delta);
        const subtotal = Number((item.unitPrice * newQty + (item.containerPrice || 0) * newQty).toFixed(2));
        return {
          ...item,
          quantity: newQty,
          subtotal
        };
      }
      return item;
    }));
  }, []);

  // Remover item do carrinho
  const removeCartItem = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setLastSaleResult(null);
  }, []);

  // Subtotal e Total
  const subtotal = useMemo(() => {
    return Number(cart.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, Number((subtotal - discount).toFixed(2)));
  }, [subtotal, discount]);

  // Finalizar a venda chamando a RPC segura
  const finalizeSale = useCallback(async (payments: PaymentPayload[]): Promise<FinalizeSaleResult> => {
    if (cart.length === 0) {
      throw new Error('O carrinho está vazio.');
    }

    try {
      setIsProcessingSale(true);

      const itemsPayload: SaleItemPayload[] = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        sale_type: item.saleType,
        container_id: item.containerId || null,
        gross_weight: item.grossWeight || null,
        tare_weight: item.tareWeight || null,
        net_weight: item.netWeight || null,
        options: item.selectedFlavors ? { flavors: item.selectedFlavors, notes: item.notes } : null,
        notes: item.notes || null,
      }));

      const payload = {
        session_id: null, // Será integrado na sessão de caixa no Sprint 5
        terminal_id: activeTerminalId,
        employee_id: activeCashierId,
        customer_id: null,
        discount: discount,
        items: itemsPayload,
        payments,
      };

      const result = await orderService.finalizeSale(payload);
      setLastSaleResult(result);
      setCart([]);
      setDiscount(0);
      return result;
    } catch (err: any) {
      console.error('Erro ao finalizar venda no PDV:', err);
      throw err;
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, discount, activeTerminalId, activeCashierId]);

  return {
    categories,
    products,
    containers,
    scoopContainers,
    weightContainers,
    availableFlavors,
    activeCategoryId,
    setActiveCategoryId,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    cart,
    subtotal,
    discount,
    setDiscount,
    total,
    addUnitProduct,
    addScoopItem,
    addWeightItem,
    updateItemQuantity,
    removeCartItem,
    clearCart,
    finalizeSale,
    isLoadingCatalog,
    isProcessingSale,
    catalogError,
    activeTerminalId,
    setActiveTerminalId,
    activeCashierId,
    setActiveCashierId,
    lastSaleResult,
    refreshCatalog: loadCatalog,
  };
}
