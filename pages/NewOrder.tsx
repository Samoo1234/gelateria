import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../constants';
import { Product, CartItem } from '../types';

const NewOrder: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Casquinha');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = activeCategory === 'Bebidas' ? true : p.category === activeCategory; // Mock behavior for categories not fully populated
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      // For demo purposes, if category is 'Casquinha', show specific items, else show random fallback if empty
      return (p.category === activeCategory) && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col group/design-root overflow-hidden bg-background-light dark:bg-background-dark text-[#0d1b14] dark:text-surface-light font-display">
      {/* TopNavBar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 dark:border-primary/10 px-6 py-3 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm z-20">
        <NavLink to="/dashboard" className="flex items-center gap-4 text-[#0d1b14] dark:text-background-light">
          <div className="size-6 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Sorveteria Gelato</h2>
        </NavLink>
        <div className="flex flex-1 justify-end items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ana Souza</span>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrZ05NrFFHoPbctAiwIzkNGfu8PBaXmnxw2AUJDhARPi71qAItKQpRIOu_ceqvTASTTJ1BHskHbTfa_5rmjop9VFg-SYfflnc27VQOOfUMDIfUNRcvYAQx-intdKSKHohNOfjZ5SYI1WxUpxlhLOUdd11CJKOoXCB5YJ8dQSd9mM91rrreCJ4naUMWqkWvaN1P-upBCjjpnMmRbWn8SEj0cxWMnq4G1g5IGieh4WMLiBsdJlLlehgHNTwtmPTJGlGzXGLafrc2KcA")'}}></div>
          <NavLink to="/" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/30 text-[#0d1b14] dark:text-background-light text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors">
            <span className="truncate">Sair</span>
          </NavLink>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex h-full grow flex-row overflow-hidden">
        {/* Left Panel: Product Selection */}
        <div className="flex flex-col w-3/5 border-r border-primary/20 dark:border-primary/10">
          <div className="p-6 border-b border-primary/20 dark:border-primary/10">
            <div className="flex flex-wrap justify-between gap-3">
              <p className="text-[#0d1b14] dark:text-background-light text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Novo Pedido</p>
            </div>
            <div className="pt-4">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-[#4c9a73] dark:text-primary/70 flex border-none bg-primary/20 dark:bg-primary/10 items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-[#0d1b14] dark:text-background-light focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-primary/20 dark:bg-primary/10 h-full placeholder:text-[#4c9a73] dark:placeholder:text-primary/70 px-4 pl-2 text-base font-normal leading-normal" 
                    placeholder="Buscar produtos ou sabores" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </label>
            </div>
          </div>
          
          <div className="pb-3 border-b border-primary/20 dark:border-primary/10">
            <div className="flex px-4 gap-8">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors cursor-pointer ${
                    activeCategory === cat 
                      ? 'border-b-primary text-[#0d1b14] dark:text-background-light' 
                      : 'border-b-transparent text-[#4c9a73] dark:text-primary/70 hover:text-[#0d1b14] dark:hover:text-background-light'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">{cat}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex flex-col gap-3 pb-3 cursor-pointer group" onClick={() => addToCart(product)}>
                  <div 
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl transition-transform group-hover:scale-105" 
                    style={{backgroundImage: `url("${product.image}")`}}
                  ></div>
                  <div>
                    <p className="text-[#0d1b14] dark:text-background-light text-base font-medium leading-normal">{product.name}</p>
                    <p className="text-[#4c9a73] dark:text-primary/80 text-sm font-normal leading-normal">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-500">
                  <p>Nenhum produto encontrado nesta categoria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Order Summary */}
        <div className="flex flex-col w-2/5 bg-primary/10 dark:bg-primary/5">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-[#0d1b14] dark:text-background-light">Resumo do Pedido</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto px-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Carrinho vazio</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-background-light dark:bg-background-dark/30 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <img alt={item.name} className="size-16 rounded-lg object-cover" src={item.image} />
                  <div className="flex-grow">
                    <p className="font-bold text-[#0d1b14] dark:text-background-light">{item.category} - {item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#0d1b14] dark:text-background-light">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="flex items-center justify-center size-7 rounded-full bg-primary/20 dark:bg-primary/30 hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex items-center justify-center size-7 rounded-full bg-primary/20 dark:bg-primary/30 hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                  <p className="font-bold text-lg text-[#0d1b14] dark:text-background-light w-20 text-right">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 mt-auto border-t-2 border-dashed border-primary/30 dark:border-primary/20 space-y-4">
            <div className="flex justify-between items-center text-[#0d1b14] dark:text-background-light">
              <span className="text-base font-medium">Subtotal</span>
              <span className="text-base font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center text-[#0d1b14] dark:text-background-light">
              <span className="text-base font-medium">Descontos</span>
              <span className="text-base font-medium text-red-500">- R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center text-[#0d1b14] dark:text-background-light mt-2 pt-2 border-t border-primary/20 dark:border-primary/10">
              <span className="text-2xl font-black">Total</span>
              <span className="text-2xl font-black">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setCart([])} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary/20 dark:bg-primary/30 text-[#0d1b14] dark:text-background-light text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors">Limpar</button>
              <button onClick={() => alert('Pedido finalizado!')} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-[#0d1b14] dark:text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors">Finalizar Pedido</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewOrder;
