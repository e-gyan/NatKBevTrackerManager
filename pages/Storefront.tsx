
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, Product, CartItem, PaymentMethod, Transaction, Settings, Customer, AIChat } from '../types';
import { chatWithStoreAssistant } from '../services/gemini';
import { ShoppingBag, Search, ShoppingCart, Plus, Minus, X, CheckCircle, ArrowLeft, ArrowRight, Truck, ShieldCheck, MapPin, User, Phone, Smartphone, Bike, Store, Loader2, Gift, Clock, Sparkles, TrendingDown, MessageCircle, Bot, Send, Zap, Heart, AlertCircle } from 'lucide-react';

interface StorefrontProps {
  data: AppData;
  settings: Settings;
  onUpdate: (data: AppData) => void;
  onBackToAdmin: () => void;
}

const Storefront: React.FC<StorefrontProps> = ({ data, settings, onUpdate, onBackToAdmin }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'DETAILS' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS'>('CART');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [consentToPromotions, setConsentToPromotions] = useState(false);
  const [momoNetwork, setMomoNetwork] = useState<'MTN' | 'TELECEL' | 'AT'>('MTN');
  const [momoNumber, setMomoNumber] = useState('');

  // AI Chat State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<{sender: 'user' | 'bot', text: string}[]>([
      {sender: 'bot', text: "Hello! I'm your BevTracker assistant. Looking for drinks, snacks, or bulk provisions?"}
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, isAiChatOpen]);

  // --- Logic ---
  const filteredProducts = useMemo(() => {
    return data.products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesSize = sizeFilter === 'All' || p.size === sizeFilter;
      return !p.isArchived && p.stock > 0 && matchesSearch && matchesCat && matchesSize;
    });
  }, [data.products, searchTerm, categoryFilter, sizeFilter]);

  // Active Bundles Logic
  const activeBundles = useMemo(() => {
    const now = new Date();
    return (data.promotions || []).filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return p.isActive && now >= start && now <= end;
    }).map(promo => {
        let originalPrice = 0;
        let maxStock = 9999;
        
        promo.items.forEach(item => {
            const product = data.products.find(p => p.id === item.productId);
            if (product) {
                originalPrice += (product.sellPrice * item.quantity);
                const itemStockLimit = Math.floor(product.stock / item.quantity);
                if (itemStockLimit < maxStock) maxStock = itemStockLimit;
            }
        });

        const end = new Date(promo.endDate);
        const diffTime = Math.abs(end.getTime() - now.getTime());
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        return {
            ...promo,
            originalPrice,
            savings: originalPrice - promo.price,
            stock: maxStock,
            daysRemaining
        };
    }).filter(b => b.stock > 0);
  }, [data.promotions, data.products]);

  const addToCart = (product: Product, isPromo = false, promoItems: {productId: string, quantity: number}[] = []) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, discount: 0, isPromotion: isPromo, promotionItems: promoItems }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);

  // --- Payment & Order Logic ---
  const handleInitiatePayment = () => {
    if (!customerName || !customerPhone) {
      alert("Please enter your name and phone number.");
      return;
    }
    if (deliveryMode === 'DELIVERY' && !address) {
      alert("Please enter a delivery address.");
      return;
    }
    setCheckoutStep('PAYMENT');
  };

  const handleProcessPayment = async () => {
      if (!momoNumber || momoNumber.length < 10) {
          alert("Please enter a valid Mobile Money number.");
          return;
      }
      setCheckoutStep('PROCESSING');
      // Simulate API
      await new Promise(resolve => setTimeout(resolve, 3000));
      completeOrder();
  };

  const completeOrder = () => {
    const orderItems = cart.map(item => {
        let buyPriceAtMoment = item.buyPrice;
        if (item.isPromotion && item.promotionItems) {
            let totalCost = 0;
            item.promotionItems.forEach(pi => {
                const p = data.products.find(prod => prod.id === pi.productId);
                if (p) totalCost += (p.buyPrice * pi.quantity);
            });
            buyPriceAtMoment = totalCost;
        }
        return {
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            priceAtMoment: item.sellPrice,
            buyPriceAtMoment: buyPriceAtMoment,
            discount: 0,
            isPromotion: item.isPromotion,
            promotionItems: item.promotionItems // Persist this for refund logic!
        };
    });

    const totalProfit = orderItems.reduce((acc, item) => acc + ((item.priceAtMoment - item.buyPriceAtMoment) * item.quantity), 0);

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'SALE',
      source: 'ONLINE',
      status: 'PENDING',
      paymentStatus: 'PAID',
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.MOMO, 
      totalAmount: cartTotal,
      profit: totalProfit,
      deliveryMode: deliveryMode,
      momoDetails: { network: momoNetwork, number: momoNumber },
      deliveryDetails: {
        customerName,
        customerPhone,
        address: deliveryMode === 'PICKUP' ? 'Store Pickup' : address
      },
      items: orderItems
    };

    let updatedCustomers = [...(data.customers || [])];
    if (consentToPromotions) {
      const existingCustomerIndex = updatedCustomers.findIndex(c => c.phone === customerPhone);
      if (existingCustomerIndex > -1) {
        updatedCustomers[existingCustomerIndex] = {
          ...updatedCustomers[existingCustomerIndex],
          name: customerName,
          totalSpent: updatedCustomers[existingCustomerIndex].totalSpent + cartTotal
        };
      } else {
        updatedCustomers.push({
          id: crypto.randomUUID(),
          name: customerName,
          phone: customerPhone,
          totalSpent: cartTotal,
          joinedDate: new Date().toISOString()
        });
      }
    }

    const updatedProducts = [...data.products];
    cart.forEach(cartItem => {
        if (cartItem.isPromotion && cartItem.promotionItems) {
            cartItem.promotionItems.forEach(promoItem => {
                 const pIndex = updatedProducts.findIndex(p => p.id === promoItem.productId);
                 if (pIndex > -1) updatedProducts[pIndex] = { ...updatedProducts[pIndex], stock: updatedProducts[pIndex].stock - (promoItem.quantity * cartItem.quantity) };
            });
        } else {
            const pIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
            if (pIndex > -1) updatedProducts[pIndex] = { ...updatedProducts[pIndex], stock: updatedProducts[pIndex].stock - cartItem.quantity };
        }
    });

    onUpdate({
      ...data,
      products: updatedProducts,
      transactions: [newTransaction, ...data.transactions],
      customers: updatedCustomers
    });

    setCheckoutStep('SUCCESS');
    setCart([]);
  };

  // --- AI Chat Logic ---
  const handleAiSend = async () => {
      if (!aiInput.trim()) return;
      
      const userMsg = aiInput;
      setAiChatHistory(prev => [...prev, {sender: 'user', text: userMsg}]);
      setAiInput('');
      setAiLoading(true);

      const apiKey = process.env.API_KEY || ''; // In real app, secure backend proxy
      const response = await chatWithStoreAssistant(userMsg, data.products, apiKey);

      setAiChatHistory(prev => [...prev, {sender: 'bot', text: response}]);
      setAiLoading(false);
  };

  const handleWhatsApp = () => {
      const msg = "Hello BevTracker! I'm browsing your website and have some questions.";
      window.open(`https://wa.me/233240000000?text=${encodeURIComponent(msg)}`, '_blank'); // Replace with real number
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-x-hidden selection:bg-purple-200">
      
      {/* --- ARTISTIC HERO SECTION --- */}
      <div className="relative bg-slate-900 text-white pb-32 overflow-hidden">
         {/* Abstract Shapes */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
         
         <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                    <Sparkles size={16} className="text-purple-300"/>
                </div>
                <span className="text-xl font-bold tracking-tight">BevTracker</span>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 hover:bg-white/10 rounded-full transition-all group"
            >
              <ShoppingBag size={24} className="text-white group-hover:scale-110 transition-transform"/>
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 bg-purple-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                  {cart.reduce((a,b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
         </nav>

         <div className="relative z-10 max-w-4xl mx-auto text-center mt-12 px-4 space-y-6">
            <span className="inline-block px-4 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-medium tracking-wider uppercase text-purple-200">Premium Wholesale Drinks & Provisions</span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
               Experience the Art of <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">Refreshment.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto font-light leading-relaxed">
               Stock up your shop or home with our comprehensive selection of beverages, snacks, and daily essentials at unbeatable wholesale prices.
            </p>
         </div>
      </div>

      {/* --- MAIN CONTENT CONTAINER (Floating Up) --- */}
      <div className="relative z-20 -mt-24 max-w-7xl mx-auto px-4 pb-20">
         
         {/* BUNDLES */}
         {activeBundles.length > 0 && (
             <div className="mb-12">
                 <div className="flex items-center gap-3 mb-6 px-2">
                     <Gift className="text-white" size={24}/>
                     <h2 className="text-2xl font-bold text-white">Curated Collections</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activeBundles.map(bundle => {
                         const discountPercent = Math.round((bundle.savings / bundle.originalPrice) * 100);
                         return (
                         <div key={bundle.id} className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
                             {/* Decorative bg gradient */}
                             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                             <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="pr-2">
                                        <h3 className="text-xl font-bold text-slate-800 leading-tight">{bundle.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 font-light">{bundle.description || 'Exclusive seasonal bundle.'}</p>
                                    </div>
                                {bundle.savings > 0 && (
                                    <div className="bg-red-100/80 text-red-700 border border-red-200 px-3 py-1.5 rounded-full shadow-sm flex items-center shrink-0">
                                        <span className="font-black text-sm tracking-tight">Save {settings.currency}{bundle.savings.toFixed(0)} ({discountPercent}% Off)</span>
                                    </div>
                                )}
                                </div>

                                {/* Detailed Items List */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex-1 shadow-inner">
                                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <Package size={16} className="text-purple-500"/> Includes:
                                    </p>
                                    <ul className="space-y-3">
                                        {bundle.items.map((item, i) => {
                                            const pName = data.products.find(p => p.id === item.productId)?.name || 'Unknown Item';
                                            return (
                                                <li key={i} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                                    <span className="text-slate-700 font-medium truncate flex-1">{pName}</span>
                                                    <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap shrink-0">Qty: {item.quantity}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>

                                {/* Duration Label */}
                                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 font-bold mb-4 uppercase tracking-wider border border-amber-200 shadow-sm w-full">
                                    <Clock size={16} className="text-amber-500 shrink-0"/>
                                    <span className="truncate">Offer ends in <span className="text-amber-900">{bundle.daysRemaining} days</span></span>
                                </div>

                                <div className="flex items-end justify-between mt-auto border-t border-slate-100 pt-4">
                                    <div>
                                        <span className="block text-xs text-slate-400 line-through mb-0.5">was {settings.currency}{bundle.originalPrice.toFixed(2)}</span>
                                        <span className="text-2xl font-bold text-purple-900 leading-none">{settings.currency}{bundle.price.toFixed(2)}</span>
                                    </div>
                                    <button 
                                        onClick={() => addToCart({ id: bundle.id, name: bundle.name, buyPrice: 0, sellPrice: bundle.price, stock: bundle.stock, minStock: 0, category: 'Bundle', description: bundle.description, isArchived: false }, true, bundle.items)}
                                        className="bg-slate-900 text-white p-3 rounded-xl hover:bg-purple-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2 font-bold text-sm"
                                    >
                                        <Plus size={18}/> Add Deal
                                    </button>
                                </div>
                             </div>
                         </div>
                     )})}
                 </div>
             </div>
         )}

         {/* STICKY FILTERS BAR */}
         <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
            <div className="relative w-full md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18}/>
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x">
                {/* Category Pills */}
                <div className="flex gap-2 items-center md:border-r md:border-slate-200 md:pr-4 snap-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Category</span>
                    <button onClick={() => setCategoryFilter('All')} className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all whitespace-nowrap border-2 ${categoryFilter === 'All' ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 active:bg-purple-50'}`}>All</button>
                    {settings.inventoryCategories.map(cat => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all whitespace-nowrap border-2 ${categoryFilter === cat ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 active:bg-purple-50'}`}>{cat}</button>
                    ))}
                </div>

                {/* Size Pills */}
                <div className="flex gap-2 items-center snap-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Size</span>
                    <button onClick={() => setSizeFilter('All')} className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all whitespace-nowrap border-2 ${sizeFilter === 'All' ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 active:bg-indigo-50'}`}>Any Size</button>
                    {(settings.productSizes || []).map(size => (
                        <button key={size} onClick={() => setSizeFilter(size)} className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all whitespace-nowrap border-2 ${sizeFilter === size ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 active:bg-indigo-50'}`}>{size}</button>
                    ))}
                </div>
            </div>
         </div>

         {/* PRODUCT GRID */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
               <div key={product.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col h-full transform hover:-translate-y-1">
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                     {/* Placeholder Artistic Graphic */}
                     <div className="text-[80px] font-serif text-slate-300 opacity-60 group-hover:scale-110 transition-transform duration-500 select-none drop-shadow-sm">
                        {product.name.charAt(0)}
                     </div>
                     
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2 hover:bg-purple-600 active:scale-95 mx-auto"
                        >
                           <ShoppingCart size={16}/> Add to Cart
                        </button>
                     </div>

                     {product.stock <= 5 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md uppercase tracking-wide animate-pulse">
                           <AlertCircle size={12}/> Only {product.stock} Left!
                        </div>
                     )}
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1 bg-white">
                     <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-md uppercase tracking-wide">
                           {product.category}
                        </span>
                        {product.size && (
                           <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                              Size: {product.size}
                           </span>
                        )}
                     </div>
                     
                     <h3 className="font-bold text-slate-900 text-base leading-snug mb-1 group-hover:text-purple-700 transition-colors line-clamp-2">{product.name}</h3>
                     {product.description && (
                         <p className="text-slate-500 text-xs line-clamp-2 font-medium mb-4 flex-1">{product.description}</p>
                     )}
                     {!product.description && <div className="flex-1"></div>}
                     
                     <div className="mt-4 flex items-end justify-between border-t border-slate-50 pt-3">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Price</span>
                           <span className="text-xl font-black text-slate-900 leading-none">{settings.currency}{product.sellPrice.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-purple-100 hover:text-purple-700 transition-colors lg:hidden active:bg-purple-200 shrink-0"
                        >
                           <Plus size={20}/>
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
         
         {filteredProducts.length === 0 && (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                 <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                     <Search className="text-slate-300" size={32}/>
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">No products found</h3>
                 <p className="text-slate-500">Try adjusting your filters or search term.</p>
             </div>
         )}
      </div>

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur z-10">
                 <h2 className="text-xl font-bold text-slate-800">Your Selection ({cart.length})</h2>
                 <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
              </div>

              {checkoutStep === 'CART' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                     {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                           <ShoppingBag size={64} className="mb-4 opacity-50"/>
                           <p>Your bag is empty.</p>
                        </div>
                     ) : (
                        cart.map(item => (
                           <div key={item.id} className="flex gap-4 p-3 border border-slate-100 rounded-2xl hover:border-purple-100 transition-colors">
                              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center font-serif text-2xl text-slate-300">
                                 {item.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                 <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                                 <div className="text-purple-600 font-bold text-sm mt-1">{settings.currency}{item.sellPrice * item.quantity}</div>
                                 
                                 <div className="flex items-center justify-between mt-3">
                                     <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-purple-600"><Minus size={12}/></button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-purple-600"><Plus size={12}/></button>
                                     </div>
                                     <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="text-3xl font-bold text-slate-900">{settings.currency}{cartTotal}</span>
                     </div>
                     <button 
                        disabled={cart.length === 0}
                        onClick={() => setCheckoutStep('DETAILS')}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Secure Checkout <Truck size={20}/>
                     </button>
                  </div>
                </>
              )}

              {/* ... reusing existing checkout steps with updated UI classes ... */}
              {checkoutStep === 'DETAILS' && (
                  <div className="flex-1 flex flex-col bg-white">
                      <div className="p-6 flex-1 overflow-y-auto space-y-6">
                         <button onClick={() => setCheckoutStep('CART')} className="text-slate-500 flex items-center gap-1 text-sm hover:text-purple-600 font-medium">
                            <ArrowLeft size={16}/> Back to Cart
                         </button>
                         
                         <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Delivery Details</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDeliveryMode('DELIVERY')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryMode === 'DELIVERY' ? 'border-purple-600 bg-purple-50 text-purple-800' : 'border-slate-100 text-slate-400'}`}>
                                    <Bike size={24}/> <span className="text-xs font-bold">Delivery</span>
                                </button>
                                <button onClick={() => setDeliveryMode('PICKUP')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryMode === 'PICKUP' ? 'border-purple-600 bg-purple-50 text-purple-800' : 'border-slate-100 text-slate-400'}`}>
                                    <Store size={24}/> <span className="text-xs font-bold">Pickup</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                               <input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                               <input type="tel" className="w-full p-4 bg-slate-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                               {deliveryMode === 'DELIVERY' && (
                                   <textarea className="w-full p-4 bg-slate-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 resize-none h-24" placeholder="Delivery Address / Landmark" value={address} onChange={e => setAddress(e.target.value)} />
                               )}
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={consentToPromotions} onChange={(e) => setConsentToPromotions(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300" />
                                <span className="text-sm text-slate-600">Save my info for exclusive offers.</span>
                            </label>
                         </div>
                      </div>
                      <div className="p-6 border-t border-slate-100">
                         <button onClick={handleInitiatePayment} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                            Proceed to Pay <ArrowRight size={18}/>
                         </button>
                      </div>
                  </div>
              )}

              {checkoutStep === 'PAYMENT' && (
                  <div className="flex-1 flex flex-col bg-white">
                      <div className="p-6 flex-1 overflow-y-auto">
                         <button onClick={() => setCheckoutStep('DETAILS')} className="text-slate-500 flex items-center gap-1 text-sm mb-6 hover:text-purple-600">
                            <ArrowLeft size={16}/> Back
                         </button>
                         <h3 className="text-2xl font-bold text-slate-800 mb-2">Mobile Money</h3>
                         <p className="text-slate-500 text-sm mb-8">Secure instant payment via your network.</p>

                         <div className="grid grid-cols-3 gap-3 mb-8">
                             {['MTN', 'TELECEL', 'AT'].map((net) => (
                                 <button key={net} onClick={() => setMomoNetwork(net as any)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${momoNetwork === net ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-100 opacity-50'}`}>
                                     <span className="text-xs font-bold">{net}</span>
                                 </button>
                             ))}
                         </div>

                         <div className="relative mb-6">
                             <div className="absolute top-3 left-4 text-slate-400 pointer-events-none">
                                 <Smartphone size={20}/>
                             </div>
                             <input 
                                type="tel" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-purple-500 rounded-xl outline-none font-mono text-lg tracking-widest transition-all"
                                placeholder="024 XXX XXXX"
                                value={momoNumber}
                                onChange={e => setMomoNumber(e.target.value)}
                                maxLength={10}
                             />
                         </div>
                         
                         <div className="bg-yellow-50 p-4 rounded-xl text-xs text-yellow-800 flex gap-2 items-start">
                             <Zap size={16} className="shrink-0 mt-0.5"/>
                             <span>You will receive a prompt on your phone to authorize <strong>{settings.currency}{cartTotal}</strong>.</span>
                         </div>
                      </div>
                      <div className="p-6 border-t border-slate-100">
                         <button onClick={handleProcessPayment} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                            Pay Now
                         </button>
                      </div>
                  </div>
              )}

              {/* Processing & Success steps reused with same style... */}
              {checkoutStep === 'PROCESSING' && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                      <Loader2 size={48} className="text-purple-600 animate-spin mb-4"/>
                      <h3 className="text-xl font-bold text-slate-800">Waiting for Approval</h3>
                      <p className="text-slate-500 mt-2 text-sm">Check your phone {momoNumber}...</p>
                  </div>
              )}

              {checkoutStep === 'SUCCESS' && (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg">
                       <CheckCircle size={40}/>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">We've received your payment. You'll hear from us shortly regarding your delivery.</p>
                    <button 
                       onClick={() => {
                          setCheckoutStep('CART');
                          setIsCartOpen(false);
                          setCustomerName('');
                          setMomoNumber('');
                       }}
                       className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-200 transition-all"
                    >
                       Shop More
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* --- FLOATING CHAT WIDGETS --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4 items-end">
          
          {/* WhatsApp Button */}
          <button 
            onClick={handleWhatsApp}
            className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Chat on WhatsApp"
          >
              <MessageCircle size={28} fill="white"/>
          </button>

          {/* AI Chat Button */}
          <button 
            onClick={() => setIsAiChatOpen(!isAiChatOpen)}
            className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative"
          >
              {isAiChatOpen ? <X size={24}/> : <Sparkles size={24}/>}
              {!isAiChatOpen && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
              )}
          </button>
      </div>

      {/* --- INTELLIGENT CHAT WINDOW --- */}
      {isAiChatOpen && (
          <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-40 flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
              {/* Chat Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur">
                      <Bot size={20}/>
                  </div>
                  <div>
                      <h4 className="font-bold text-sm">BevTracker AI</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                  </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4">
                  {aiChatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                              {msg.text}
                          </div>
                      </div>
                  ))}
                  {aiLoading && (
                      <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                          </div>
                      </div>
                  )}
                  <div ref={chatScrollRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                    placeholder="Ask about drinks and provisions..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                  />
                  <button 
                    onClick={handleAiSend} 
                    disabled={!aiInput.trim() || aiLoading}
                    className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:bg-slate-300 transition-colors"
                  >
                      <Send size={16}/>
                  </button>
              </div>
          </div>
      )}

      {/* Admin Back Button (Hidden mostly, bottom left) */}
      <button 
        onClick={onBackToAdmin}
        className="fixed bottom-4 left-4 z-30 bg-white/50 backdrop-blur text-slate-900 px-4 py-2 rounded-full shadow-sm text-xs font-bold opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2"
      >
        <ArrowLeft size={14}/> Admin
      </button>

    </div>
  );
};

export default Storefront;
