import React, { useState } from 'react';
import { POSLayout } from '../components/POSLayout';
import { usePOS, CartItemUI } from '../hooks/usePOS';
import { ProductRow } from '../services/orderService';
import { ScoopSelectionModal } from '../components/ScoopSelectionModal';
import { WeightSelectionModal } from '../components/WeightSelectionModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { CashRegisterModal } from '../components/CashRegisterModal';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  IceCream, 
  CheckCircle2, 
  RefreshCw,
  AlertTriangle,
  Scale
} from 'lucide-react';

const NewOrder: React.FC = () => {
  const {
    categories,
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
    activeCashierId,
    activeSession,
    refreshSession,
    lastSaleResult,
    refreshCatalog,
  } = usePOS();

  // Estados de modais
  const [scoopModalProduct, setScoopModalProduct] = useState<ProductRow | null>(null);
  const [weightModalProduct, setWeightModalProduct] = useState<ProductRow | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Manipular clique no produto
  const handleProductClick = (product: ProductRow) => {
    // Se for sorvete por bola ou tiver recipientes associados
    if (product.sale_type === 'SCOOP' || product.is_flavor) {
      setScoopModalProduct(product);
      return;
    }

    if (product.sale_type === 'WEIGHT') {
      setWeightModalProduct(product);
      return;
    }

    // Caso padrão: produto unitário
    addUnitProduct(product);
  };

  const handleCheckoutSuccess = async (payments: any) => {
    const result = await finalizeSale(payments);
    setSaleSuccessMessage(`Pedido ${result.order_number} finalizado com sucesso! Total: R$ ${result.total.toFixed(2).replace('.', ',')}`);
    setTimeout(() => {
      setSaleSuccessMessage(null);
    }, 4000);
    return result;
  };

  return (
    <POSLayout
      sessionStatus={activeSession ? 'OPEN' : 'CLOSED'}
      onOpenCashRegister={() => setIsCashRegisterOpen(true)}
    >
      <div className="flex h-full w-full overflow-hidden">
        
        {/* Painel Esquerdo: Catálogo & Seleção Touch */}
        <div className="flex flex-col w-3/5 border-r border-primary/20 bg-background-light dark:bg-background-dark">
          
          {/* Barra de Busca & Ações Rápidas */}
          <div className="p-4 border-b border-primary/20 bg-surface-light dark:bg-surface-dark/50">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-primary" />
                <input
                  type="text"
                  placeholder="Buscar produtos pelo nome ou sabor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-primary/20 bg-primary/5 focus:bg-surface-light dark:focus:bg-surface-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted hover:text-primary px-2 py-1"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <button
                onClick={refreshCatalog}
                title="Recarregar catálogo do servidor"
                className="p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary transition-colors active:scale-95"
              >
                <RefreshCw className="size-5" />
              </button>
            </div>

            {/* Categorias Touch Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer min-h-[42px] ${
                  activeCategoryId === null
                    ? 'bg-primary text-[#0d1b14] shadow-sm'
                    : 'bg-primary/10 hover:bg-primary/20 text-[#0d1b14] dark:text-surface-light'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer min-h-[42px] ${
                    activeCategoryId === cat.id
                      ? 'bg-primary text-[#0d1b14] shadow-sm'
                      : 'bg-primary/10 hover:bg-primary/20 text-[#0d1b14] dark:text-surface-light'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Produtos Touch */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {catalogError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-300 text-red-700 dark:text-red-300 mb-4">
                <AlertTriangle className="size-5 shrink-0" />
                <span className="text-sm font-medium">{catalogError}</span>
              </div>
            )}

            {isLoadingCatalog ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
                <RefreshCw className="size-8 animate-spin text-primary" />
                <p className="text-sm font-semibold">Carregando catálogo oficial...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-text-muted">
                <ShoppingBag className="size-12 mb-2 opacity-40" />
                <p className="text-base font-semibold">Nenhum produto encontrado</p>
                <p className="text-xs">Tente outra categoria ou termo de busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const isScoop = product.sale_type === 'SCOOP' || product.is_flavor;
                  const isWeight = product.sale_type === 'WEIGHT';
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="group flex flex-col justify-between p-3.5 rounded-2xl border border-primary/20 bg-surface-light dark:bg-surface-dark hover:border-primary hover:shadow-lg transition-all text-left cursor-pointer active:scale-95 min-h-[130px]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-bold text-sm text-[#0d1b14] dark:text-surface-light line-clamp-2 leading-tight">
                            {product.name}
                          </span>
                          {isScoop && (
                            <span className="shrink-0 p-1 rounded-md bg-primary/20 text-primary" title="Sorvete por Bola">
                              <IceCream className="size-3.5" />
                            </span>
                          )}
                          {isWeight && (
                            <span className="shrink-0 p-1 rounded-md bg-caramel/20 text-caramel" title="Por Quilo">
                              <Scale className="size-3.5" />
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-[11px] text-text-muted line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-primary/10">
                        <span className="text-xs text-text-muted">
                          {isWeight ? 'Por kg' : isScoop ? 'Por bola' : 'Unidade'}
                        </span>
                        <span className="text-sm font-extrabold text-primary">
                          R$ {Number(product.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Carrinho Touchscreen & Checkout */}
        <div className="flex flex-col w-2/5 bg-primary/5 dark:bg-primary/5 border-l border-primary/10">
          
          {/* Header do Carrinho */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-surface-light dark:bg-surface-dark/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <h3 className="font-bold text-base text-[#0d1b14] dark:text-surface-light">
                Itens do Pedido ({cart.length})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="size-3.5" />
                Limpar
              </button>
            )}
          </div>

          {/* Banner de Sucesso de Venda */}
          {saleSuccessMessage && (
            <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
              <span>{saleSuccessMessage}</span>
            </div>
          )}

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-text-muted py-12">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary/60">
                  <IceCream className="size-8" />
                </div>
                <p className="font-bold text-sm">O pedido está vazio</p>
                <p className="text-xs text-text-muted max-w-[200px] mt-1">
                  Toque nos produtos ou sabores ao lado para adicionar ao pedido.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0d1b14] dark:text-surface-light leading-tight">
                        {item.productName}
                      </h4>
                      {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                        <p className="text-xs text-text-muted mt-0.5">
                          Sabores: <strong>{item.selectedFlavors.join(' + ')}</strong>
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-caramel italic mt-0.5">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="text-text-muted hover:text-red-500 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Controles de Quantidade e Valor */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                    <div className="flex items-center gap-2">
                      {item.saleType !== 'WEIGHT' ? (
                        <>
                          <button
                            onClick={() => updateItemQuantity(item.id, -1)}
                            className="size-7 rounded-lg bg-primary/20 text-[#0d1b14] dark:text-surface-light hover:bg-primary/30 flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="font-extrabold text-sm w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQuantity(item.id, 1)}
                            className="size-7 rounded-lg bg-primary/20 text-[#0d1b14] dark:text-surface-light hover:bg-primary/30 flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-text-muted">
                          {item.netWeight?.toFixed(3)} kg
                        </span>
                      )}
                    </div>

                    <span className="font-black text-sm text-primary">
                      R$ {item.subtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé: Totais e Botão de Finalização */}
          <div className="p-4 border-t-2 border-dashed border-primary/30 bg-surface-light dark:bg-surface-dark space-y-3">
            <div className="flex justify-between text-xs text-text-muted font-semibold">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-xs text-red-500 font-semibold">
                <span>Desconto</span>
                <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-1 border-t border-primary/10">
              <span className="text-base font-black text-[#0d1b14] dark:text-surface-light">
                Total a Pagar
              </span>
              <span className="text-2xl font-black text-primary">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0 || isProcessingSale}
              className="w-full py-4 rounded-xl font-black text-base bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="size-5" />
              Cobrar / Finalizar (R$ {total.toFixed(2).replace('.', ',')})
            </button>
          </div>

        </div>

      </div>

      {/* Modal de Escolha de Bolas / Sabores */}
      {scoopModalProduct && (
        <ScoopSelectionModal
          isOpen={!!scoopModalProduct}
          onClose={() => setScoopModalProduct(null)}
          baseProduct={scoopModalProduct}
          availableContainers={scoopContainers}
          availableFlavors={availableFlavors}
          onConfirm={(container, flavors, notes) => {
            addScoopItem(scoopModalProduct, container, flavors, notes);
          }}
        />
      )}

      {/* Modal de Pesagem / Tara Automática por Quilo */}
      {weightModalProduct && (
        <WeightSelectionModal
          isOpen={!!weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
          product={weightModalProduct}
          availableContainers={weightContainers}
          onConfirm={(container, grossWeightKg, notes) => {
            addWeightItem(weightModalProduct, container, grossWeightKg, notes);
          }}
        />
      )}

      {/* Modal de Pagamento & Finalização Atômica */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          totalAmount={total}
          onFinalize={handleCheckoutSuccess}
          isProcessing={isProcessingSale}
        />
      )}

      {/* Modal de Gestão e Operações de Caixa */}
      {isCashRegisterOpen && (
        <CashRegisterModal
          isOpen={isCashRegisterOpen}
          onClose={() => setIsCashRegisterOpen(false)}
          terminalId={activeTerminalId}
          employeeId={activeCashierId}
          currentSession={activeSession}
          onSessionUpdated={refreshSession}
        />
      )}
    </POSLayout>
  );
};

export default NewOrder;
