
import React, { useState, useMemo } from 'react';
import { AppData, Product, CartItem, PaymentMethod, Transaction, Settings, Promotion, Customer } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, History, RotateCcw, Edit2, Calendar, CreditCard, StickyNote, Save, CheckSquare, Square, X, Gift, Percent, Globe, Truck, MapPin, User, Phone, Users, MessageCircle, Store, AlertTriangle, Filter } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface SalesProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
  settings: Settings;
}

const Sales: React.FC<SalesProps> = ({ data, onUpdate, settings }) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY' | 'ONLINE_ORDERS' | 'CUSTOMERS' | 'PROMOTIONS'>('POS');
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [receiptData, setReceiptData] = useState<{items: CartItem[], total: number, date: string, method: string} | null>(null);

  // Promotions State
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
      name: '', price: 0, startDate: '', endDate: '', items: [], isActive: true
  });
  const [promoSearch, setPromoSearch] = useState('');

  // Edit History State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<{date: string, paymentMethod: PaymentMethod, notes: string}>({
    date: '', paymentMethod: PaymentMethod.CASH, notes: ''
  });

  // History Selection & Filter State
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [historyTimeRange, setHistoryTimeRange] = useState<'ALL' | '1D' | '7D' | '2W' | '1M' | '1Q' | '1Y'>('ALL');
  const [historyPaymentMethod, setHistoryPaymentMethod] = useState<'ALL' | PaymentMethod>('ALL');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- POS LOGIC ---
  const activePromotions = useMemo(() => {
    const now = new Date();
    return (data.promotions || []).filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return p.isActive && now >= start && now <= end;
    });
  }, [data.promotions]);

  const availableProducts = useMemo(() => {
    return data.products.filter(p => 
      p.stock > 0 && 
      !p.isArchived &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (p.barcode && p.barcode.includes(searchTerm)))
    );
  }, [data.products, searchTerm]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const term = searchTerm.trim();
      const exactMatch = data.products.find(p => 
        !p.isArchived && p.stock > 0 && 
        ((p.barcode && p.barcode === term) || p.name.toLowerCase() === term.toLowerCase())
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
      } else {
        // Fallback: if there is exactly 1 partial match, add it
        const partialMatches = data.products.filter(p => 
          !p.isArchived && p.stock > 0 && 
          (p.name.toLowerCase().includes(term.toLowerCase()) || (p.barcode && p.barcode.includes(term)))
        );
        if (partialMatches.length === 1) {
          addToCart(partialMatches[0]);
          setSearchTerm('');
        }
      }
    }
  };

  const addToCart = (product: Product, isPromo = false, promoItems: {productId: string, quantity: number}[] = []) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
          ...product, 
          quantity: 1, 
          discount: product.defaultDiscount || 0,
          isPromotion: isPromo,
          promotionItems: promoItems
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const product = data.products.find(p => p.id === id);
        if (delta > 0 && product && !item.isPromotion && newQty > product.stock) return item;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const discountedPrice = item.sellPrice * (1 - item.discount / 100);
      return acc + (discountedPrice * item.quantity);
    }, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const date = new Date().toISOString();

    const newTransactions: Transaction[] = cart.map(item => {
      const revenue = (item.sellPrice * (1 - item.discount / 100)) * item.quantity;
      let cost = 0;
      if (item.isPromotion && item.promotionItems) {
         item.promotionItems.forEach(pi => {
            const p = data.products.find(prod => prod.id === pi.productId);
            if (p) cost += (p.buyPrice * pi.quantity);
         });
         cost = cost * item.quantity;
      } else {
         cost = item.buyPrice * item.quantity;
      }
      const profit = revenue - cost;

      return {
        id: crypto.randomUUID(),
        type: 'SALE',
        source: 'POS',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        date: date,
        paymentMethod,
        totalAmount: revenue,
        profit: profit,
        items: [{
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          priceAtMoment: item.sellPrice,
          buyPriceAtMoment: cost / item.quantity, 
          discount: item.discount,
          isPromotion: item.isPromotion,
          promotionItems: item.promotionItems // Added so POS sales can also be refunded properly
        }]
      };
    });

    let updatedProducts = [...data.products];
    cart.forEach(cartItem => {
        if (cartItem.isPromotion && cartItem.promotionItems) {
            cartItem.promotionItems.forEach(promoItem => {
                 const pIndex = updatedProducts.findIndex(p => p.id === promoItem.productId);
                 if (pIndex > -1) {
                     updatedProducts[pIndex] = {
                         ...updatedProducts[pIndex],
                         stock: updatedProducts[pIndex].stock - (promoItem.quantity * cartItem.quantity)
                     };
                 }
            });
        } else {
            const pIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
            if (pIndex > -1) {
                updatedProducts[pIndex] = {
                    ...updatedProducts[pIndex],
                    stock: updatedProducts[pIndex].stock - cartItem.quantity
                };
            }
        }
    });

    onUpdate({
      ...data,
      products: updatedProducts,
      transactions: [...newTransactions, ...data.transactions]
    });

    const receiptTotal = cart.reduce((sum, item) => sum + (item.sellPrice * (1 - item.discount / 100)) * item.quantity, 0);
    setReceiptData({ items: [...cart], total: receiptTotal, date: new Date().toLocaleString(), method: paymentMethod });

    setCheckoutComplete(true);
    setTimeout(() => {
      window.print();
    }, 300);

    setTimeout(() => {
      setCheckoutComplete(false);
      setCart([]);
      setReceiptData(null);
    }, 3000);
  };

  // --- ONLINE ORDER LOGIC ---
  const onlineOrders = useMemo(() => {
    return data.transactions.filter(t => t.source === 'ONLINE').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions]);

  const handleUpdateOrderStatus = (id: string, status: 'DELIVERED') => {
      const updated = data.transactions.map(t => t.id === id ? { ...t, status } : t);
      onUpdate({ ...data, transactions: updated });
  };

  const handleRefundOrder = (order: Transaction) => {
      setConfirmModal({
          isOpen: true,
          title: 'Refund & Cancel Order',
          message: 'This will mark the payment as refunded and restore all items to your inventory.\n\nContinue?',
          isDestructive: true,
          onConfirm: () => {
              const updatedProducts = [...data.products];

              // Restore Stock
              order.items.forEach(item => {
                  // If item is a bundle with tracked components
                  if (item.isPromotion && item.promotionItems && item.promotionItems.length > 0) {
                      item.promotionItems.forEach(promoItem => {
                          const pIndex = updatedProducts.findIndex(p => p.id === promoItem.productId);
                          if (pIndex > -1) {
                              updatedProducts[pIndex] = {
                                  ...updatedProducts[pIndex],
                                  stock: updatedProducts[pIndex].stock + (promoItem.quantity * item.quantity)
                              };
                          }
                      });
                  } 
                  // If item is a regular product OR a bundle without breakdown (legacy)
                  else {
                      // Try to find the product. If it's a bundle ID, it won't affect stock unless we treat bundles as single stock items (not current logic).
                      // Current logic treats bundles as virtual. If we can't find components, we can't restore stock easily.
                      // We'll attempt to find product by ID (standard case).
                      const pIndex = updatedProducts.findIndex(p => p.id === item.productId);
                      if (pIndex > -1) {
                          updatedProducts[pIndex] = {
                              ...updatedProducts[pIndex],
                              stock: updatedProducts[pIndex].stock + item.quantity
                          };
                      }
                  }
              });

              // Update Transaction
              const updatedTransactions = data.transactions.map(t => {
                  if (t.id === order.id) {
                      return {
                          ...t,
                          status: 'CANCELLED' as const,
                          paymentStatus: 'REFUNDED' as const,
                          notes: (t.notes || '') + '\n[Refunded on ' + new Date().toLocaleDateString() + ']'
                      };
                  }
                  return t;
              });

              onUpdate({
                  ...data,
                  products: updatedProducts,
                  transactions: updatedTransactions
              });
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const openWhatsApp = (order: Transaction) => {
      const phone = order.deliveryDetails?.customerPhone;
      if (!phone) return;
      
      const mode = order.deliveryMode === 'PICKUP' ? 'ready for pickup' : 'being delivered';
      const msg = `Hello ${order.deliveryDetails?.customerName}, this is BevTracker. We have received your payment of ${settings.currency}${order.totalAmount}. Your order is ${mode}. Thank you for your patronage!`;
      
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };


  // --- PROMOTIONS LOGIC (Keep existing) ---
  const handleAddPromoItem = (product: Product) => {
      const currentItems = promoForm.items || [];
      const existing = currentItems.find(i => i.productId === product.id);
      if(existing) {
          setPromoForm({
              ...promoForm,
              items: currentItems.map(i => i.productId === product.id ? {...i, quantity: i.quantity + 1} : i)
          });
      } else {
          setPromoForm({
              ...promoForm,
              items: [...currentItems, { productId: product.id, quantity: 1 }]
          });
      }
  };
  const handleSavePromotion = () => {
      if(!promoForm.name || !promoForm.price || !promoForm.items?.length || !promoForm.startDate || !promoForm.endDate) return;
      const newPromo: Promotion = {
          id: crypto.randomUUID(),
          name: promoForm.name,
          description: promoForm.description || '',
          price: Number(promoForm.price),
          startDate: promoForm.startDate,
          endDate: promoForm.endDate,
          items: promoForm.items,
          isActive: true
      };
      onUpdate({ ...data, promotions: [...(data.promotions || []), newPromo] });
      setPromoForm({ name: '', price: 0, startDate: '', endDate: '', items: [], isActive: true });
  };
  const handleDeletePromotion = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: 'Delete Promotion',
          message: 'Are you sure you want to delete this promotion?',
          isDestructive: true,
          onConfirm: () => {
              onUpdate({ ...data, promotions: data.promotions.filter(p => p.id !== id) });
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  // --- HISTORY LOGIC ---
  const salesTransactions = useMemo(() => {
    let filtered = data.transactions.filter(t => t.type === 'SALE');
    
    // Payment Method Filter
    if (historyPaymentMethod !== 'ALL') {
      filtered = filtered.filter(t => t.paymentMethod === historyPaymentMethod);
    }
    
    // Time Range Filter (Pre-defined)
    if (historyTimeRange !== 'ALL') {
      const now = new Date();
      let startDate = new Date();
      switch (historyTimeRange) {
        case '1D': startDate.setDate(now.getDate() - 1); break;
        case '7D': startDate.setDate(now.getDate() - 7); break;
        case '2W': startDate.setDate(now.getDate() - 14); break;
        case '1M': startDate.setDate(now.getDate() - 30); break;
        case '1Q': startDate.setDate(now.getDate() - 90); break;
        case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    if (dateFilter.start) {
      const start = new Date(dateFilter.start);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= start);
    }
    if (dateFilter.end) {
      const end = new Date(dateFilter.end);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= end);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, dateFilter, historyTimeRange, historyPaymentMethod]);

  const handleVoidTransaction = (t: Transaction) => {
    setConfirmModal({
        isOpen: true,
        title: 'Void Transaction',
        message: 'Are you sure you want to void this transaction? Stock will be restored.',
        isDestructive: true,
        onConfirm: () => {
            const updatedProducts = [...data.products];
            t.items.forEach(item => {
                if(item.isPromotion) {
                    const promo = data.promotions?.find(p => p.id === item.productId);
                    if(promo) {
                        promo.items.forEach(pi => {
                            const pIndex = updatedProducts.findIndex(p => p.id === pi.productId);
                            if(pIndex > -1) updatedProducts[pIndex] = { ...updatedProducts[pIndex], stock: updatedProducts[pIndex].stock + (pi.quantity * item.quantity) };
                        });
                    }
                } else {
                     const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
                     if (productIndex > -1) updatedProducts[productIndex] = { ...updatedProducts[productIndex], stock: updatedProducts[productIndex].stock + item.quantity };
                }
            });
            const updatedTransactions = data.transactions.filter(tr => tr.id !== t.id);
            onUpdate({ ...data, products: updatedProducts, transactions: updatedTransactions });
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };
  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setEditForm({ date: t.date.slice(0, 16), paymentMethod: t.paymentMethod, notes: t.notes || '' });
    setIsEditModalOpen(true);
  };
  const saveTransactionEdit = () => {
    if (!editingTransaction) return;
    const updatedTransactions = data.transactions.map(t => t.id === editingTransaction.id ? { ...t, date: new Date(editForm.date).toISOString(), paymentMethod: editForm.paymentMethod, notes: editForm.notes } : t);
    onUpdate({ ...data, transactions: updatedTransactions });
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };
  const handleSelectAllTransactions = () => setSelectedTransactionIds(selectedTransactionIds.size === salesTransactions.length ? new Set() : new Set(salesTransactions.map(t => t.id)));
  const handleSelectTransaction = (id: string) => {
    const newSet = new Set(selectedTransactionIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedTransactionIds(newSet);
  };
  const handleBulkDeleteTransactions = () => {
      setConfirmModal({
          isOpen: true,
          title: 'Delete Transactions',
          message: `Are you sure you want to delete ${selectedTransactionIds.size} records?`,
          isDestructive: true,
          onConfirm: () => {
              onUpdate({ ...data, transactions: data.transactions.filter(t => !selectedTransactionIds.has(t.id)) });
              setSelectedTransactionIds(new Set());
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] relative">
      <div className="print:hidden flex flex-col h-full relative">
      {/* Tabs */}
      <div className="flex space-x-4 mb-4 border-b border-slate-200 overflow-x-auto shrink-0 w-full max-w-full pb-1 scrollbar-hide">
        <button onClick={() => setActiveTab('POS')} className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'POS' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}>
            <ShoppingCart size={16}/> POS
        </button>
        <button onClick={() => setActiveTab('ONLINE_ORDERS')} className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors flex items-center gap-2 relative ${activeTab === 'ONLINE_ORDERS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
            <Globe size={16}/> Online Orders
            {(onlineOrders.filter(o => o.status === 'PENDING').length > 0) && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full animate-pulse shadow-sm ring-2 ring-red-200 ring-offset-1">{onlineOrders.filter(o => o.status === 'PENDING').length}</span>}
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}>
            <History size={16}/> Sales History
        </button>
        <button onClick={() => setActiveTab('CUSTOMERS')} className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'CUSTOMERS' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'}`}>
            <Users size={16}/> Customer Base
        </button>
        <button onClick={() => setActiveTab('PROMOTIONS')} className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'PROMOTIONS' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-400'}`}>
            <Gift size={16}/> Promotions
        </button>
      </div>

      {activeTab === 'ONLINE_ORDERS' && (
          <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={20}/> Web Store Orders</h3>
              <div className="space-y-4">
                  {onlineOrders.map(order => (
                      <div key={order.id} className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 ${order.status === 'CANCELLED' ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-indigo-100 bg-indigo-50/20'}`}>
                          <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                  {order.status === 'CANCELLED' ? (
                                      <span className="px-2 py-1 rounded text-xs font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                                          <X size={12}/> REFUNDED / CANCELLED
                                      </span>
                                  ) : (
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                          Status: {order.status || 'PENDING'}
                                      </span>
                                  )}
                                  
                                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600 flex items-center gap-1">
                                      {order.deliveryMode === 'PICKUP' ? <Store size={12}/> : <Truck size={12}/>}
                                      {order.deliveryMode || 'DELIVERY'}
                                  </span>
                                  <span className="text-sm text-slate-500">{new Date(order.date).toLocaleString()}</span>
                              </div>
                              <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-indigo-100">
                                 <User size={18} className="text-slate-400 mt-1"/>
                                 <div>
                                     <p className="font-bold text-slate-800">{order.deliveryDetails?.customerName}</p>
                                     <p className="text-sm text-slate-600">{order.deliveryDetails?.customerPhone}</p>
                                     <p className="text-sm text-slate-500 italic mt-1"><MapPin size={12} className="inline"/> {order.deliveryDetails?.address}</p>
                                 </div>
                              </div>
                              {order.momoDetails && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <CreditCard size={12}/> Paid via MoMo: <span className="font-mono font-bold text-slate-700">{order.momoDetails.network} - {order.momoDetails.number}</span>
                                </div>
                              )}
                              <div className="mt-2">
                                  <p className="text-xs text-slate-400 uppercase font-bold">Items:</p>
                                  <ul className="list-disc list-inside text-sm text-slate-700">
                                      {order.items.map((item, i) => (
                                          <li key={i}>{item.productName} x {item.quantity}</li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-4">
                              <div className="text-right">
                                  <p className={`text-2xl font-bold ${order.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{settings.currency}{order.totalAmount}</p>
                                  {order.status !== 'CANCELLED' && (
                                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold mt-1">
                                        <CheckCircle size={12}/> Payment Confirmed
                                    </div>
                                  )}
                              </div>
                              
                              <div className="flex flex-col gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => openWhatsApp(order)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageCircle size={16}/> Chat Customer
                                </button>
                                {order.status !== 'CANCELLED' && (
                                    <>
                                        <select 
                                            value={order.status || 'PENDING'}
                                            onChange={(e) => {
                                                const newStatus = e.target.value as any;
                                                handleUpdateOrderStatus(order.id, newStatus);
                                                if (window.confirm(`Status updated to ${newStatus}. Send WhatsApp notification to customer?`)) {
                                                    const phone = order.deliveryDetails?.customerPhone;
                                                    if (phone) {
                                                        const msg = `Hello ${order.deliveryDetails?.customerName}, this is BevTracker. Your order status has been updated to: ${newStatus.replace(/_/g, ' ')}.`;
                                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }
                                                }
                                            }}
                                            className="bg-white border border-slate-300 text-slate-800 font-bold px-3 py-2 rounded-lg text-sm outline-none focus:border-indigo-500 w-full"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="PROCESSING">PROCESSING</option>
                                            <option value="SHIPPED">SHIPPED</option>
                                            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                            <option value="DELIVERED">DELIVERED</option>
                                        </select>
                                        {order.status !== 'DELIVERED' && (
                                            <button 
                                                onClick={() => handleRefundOrder(order)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
                                            >
                                                <RotateCcw size={16}/> Refund & Cancel
                                            </button>
                                        )}
                                    </>
                                )}
                              </div>
                          </div>
                      </div>
                  ))}
                  {onlineOrders.length === 0 && <p className="text-slate-400 text-center py-10">No online orders received yet.</p>}
              </div>
          </div>
      )}

      {activeTab === 'CUSTOMERS' && (
          <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={20}/> Customer Database</h3>
              <p className="text-sm text-slate-500 mb-4">List of customers who have given consent to store their details for promotions.</p>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                          <tr>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Phone</th>
                              <th className="px-4 py-3">Joined</th>
                              <th className="px-4 py-3 text-right">Total Spent</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {data.customers?.map(c => (
                              <tr key={c.id} onClick={() => setSelectedCustomerForHistory(c)} className="hover:bg-slate-100 cursor-pointer transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                                  <td className="px-4 py-3 text-slate-600 font-mono">{c.phone}</td>
                                  <td className="px-4 py-3 text-slate-500 text-sm">{new Date(c.joinedDate).toLocaleDateString()}</td>
                                  <td className="px-4 py-3 text-right font-bold text-green-600">{settings.currency}{c.totalSpent.toFixed(2)}</td>
                              </tr>
                          ))}
                          {(!data.customers || data.customers.length === 0) && (
                              <tr><td colSpan={4} className="text-center py-8 text-slate-400">No customers in database yet.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Existing Tabs */}
      {activeTab === 'PROMOTIONS' && (
          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
              {/* Creator */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Gift className="text-purple-600"/> Create Seasonal Bundle</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Bundle Name</label>
                              <input type="text" placeholder="e.g. Easter Hamper" className="w-full p-2 border rounded" value={promoForm.name} onChange={e => setPromoForm({...promoForm, name: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Selling Price ({settings.currency})</label>
                              <input type="number" className="w-full p-2 border rounded" value={promoForm.price} onChange={e => setPromoForm({...promoForm, price: Number(e.target.value)})}/>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                              <input type="date" className="w-full p-2 border rounded" value={promoForm.startDate} onChange={e => setPromoForm({...promoForm, startDate: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                              <input type="date" className="w-full p-2 border rounded" value={promoForm.endDate} onChange={e => setPromoForm({...promoForm, endDate: e.target.value})}/>
                          </div>
                      </div>
                      
                      {/* Bundle Items Builder */}
                      <div className="border rounded-xl p-4 bg-slate-50">
                          <h4 className="font-bold text-sm text-slate-700 mb-2">Bundle Contents</h4>
                          <div className="flex flex-wrap gap-2 mb-4">
                              {promoForm.items?.map((item, idx) => {
                                  const p = data.products.find(prod => prod.id === item.productId);
                                  return (
                                      <span key={idx} className="bg-white border px-2 py-1 rounded text-sm flex items-center gap-2 shadow-sm">
                                          {p?.name} <span className="font-bold text-purple-600">x{item.quantity}</span>
                                          <button onClick={() => setPromoForm({...promoForm, items: promoForm.items?.filter(i => i.productId !== item.productId)})} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                      </span>
                                  )
                              })}
                          </div>
                          <div className="relative">
                              <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                              <input 
                                type="text" 
                                placeholder="Search products to add..." 
                                className="w-full p-2 pl-9 border rounded"
                                value={promoSearch}
                                onChange={e => setPromoSearch(e.target.value)}
                              />
                              {promoSearch && (
                                  <div className="absolute top-full left-0 w-full bg-white border shadow-lg z-10 max-h-40 overflow-y-auto rounded-b-lg">
                                      {data.products.filter(p => p.name.toLowerCase().includes(promoSearch.toLowerCase()) && !p.isArchived).map(p => (
                                          <div key={p.id} onClick={() => { handleAddPromoItem(p); setPromoSearch(''); }} className="p-2 hover:bg-slate-50 cursor-pointer text-sm">
                                              {p.name}
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      <button onClick={handleSavePromotion} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
                          Create Bundle
                      </button>
                  </div>
              </div>

              {/* List */}
              <div className="w-full md:w-96 bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-y-auto">
                   <h3 className="font-bold text-slate-800 mb-4">Active Promotions</h3>
                   <div className="space-y-3">
                       {data.promotions?.map(promo => (
                           <div key={promo.id} className="border border-purple-100 bg-purple-50/30 p-4 rounded-xl relative group">
                               <button onClick={() => handleDeletePromotion(promo.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                               <h4 className="font-bold text-purple-900">{promo.name}</h4>
                               <div className="flex justify-between items-center text-sm mt-1 mb-2">
                                   <span className="font-mono">{promo.startDate} - {promo.endDate}</span>
                                   <span className="font-bold text-lg">{settings.currency}{promo.price}</span>
                               </div>
                               <div className="text-xs text-slate-500">
                                   Contains: {promo.items.length} items
                               </div>
                           </div>
                       ))}
                       {(!data.promotions || data.promotions.length === 0) && <p className="text-slate-400 text-center py-4">No promotions active.</p>}
                   </div>
              </div>
          </div>
      )}

      {activeTab === 'POS' ? (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 mb-6 lg:mb-0 lg:overflow-hidden">
          {/* Product Catalog */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden order-2 lg:order-1 h-[500px] lg:h-auto">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Select Products</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search inventory or scan barcode..."
                  className="w-full pl-10 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 content-start">
              {/* Promotions / Bundles Grid Section */}
              {activePromotions.map(promo => (
                  <div 
                  key={promo.id}
                  onClick={() => addToCart({
                      id: promo.id,
                      name: promo.name,
                      buyPrice: 0, // Calculated dynamically in logic or 0 for visual
                      sellPrice: promo.price,
                      stock: 999,
                      minStock: 0,
                      category: 'Bundle',
                      description: 'Seasonal Bundle',
                      isArchived: false
                  }, true, promo.items)}
                  className="p-3 border border-purple-200 bg-purple-50 rounded-lg hover:border-purple-400 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-purple-900 truncate flex items-center gap-1"><Gift size={14}/> {promo.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                        <span className="text-[10px] bg-white border border-purple-200 px-1 py-0.5 rounded text-purple-700">Bundle</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-purple-700">{settings.currency} {promo.price}</span>
                  </div>
                </div>
              ))}

              {/* Regular Products */}
              {availableProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-3 border border-slate-100 rounded-lg hover:border-primary hover:shadow-md cursor-pointer transition-all bg-white group flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-medium text-slate-800 truncate">{product.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                        <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{product.category}</span>
                        {product.size && <span className="text-[10px] bg-purple-50 px-1 py-0.5 rounded text-purple-700">{product.size}</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-primary">{settings.currency} {product.sellPrice}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Stock: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden order-1 lg:order-2 shrink-0 h-auto min-h-[300px] max-h-[55vh] lg:max-h-none">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={20} /> Current Sale
              </h2>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                  <ShoppingCart size={48} />
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={`flex flex-col p-3 border rounded-lg relative group ${item.isPromotion ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100'}`}>
                    <div className="flex justify-between mb-2">
                      <span className={`font-medium text-sm ${item.isPromotion ? 'text-purple-900 font-bold' : 'text-slate-800'}`}>
                          {item.isPromotion && <Gift size={12} className="inline mr-1"/>}
                          {item.name}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1.5 border border-slate-200/60">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm flex items-center justify-center">
                          <Minus size={18} className="text-slate-600" />
                        </button>
                        <span className="text-lg font-bold w-8 text-center text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm flex items-center justify-center">
                          <Plus size={18} className="text-slate-600" />
                        </button>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-lg text-slate-900">
                          {settings.currency} {(item.sellPrice * (1 - item.discount/100) * item.quantity).toFixed(2)}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-sm font-bold text-green-600">-{item.discount}% Off</span>
                        )}
                      </div>
                    </div>
                    
                    {/* ENHANCED MOBILE DISCOUNT FIELD */}
                    <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <label className="text-sm font-bold text-slate-600 flex items-center gap-1.5"><Percent size={14}/> Discount</label>
                      <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            min="0" max="100"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                            className="w-20 p-2 text-lg text-right font-bold text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                        <span className="text-slate-500 font-bold text-sm">%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-600 mb-2">Payment Method</label>
                 <div className="grid grid-cols-2 gap-2">
                   {Object.values(PaymentMethod).map(method => (
                     <button
                       key={method}
                       onClick={() => setPaymentMethod(method)}
                       className={`px-2 py-2 text-xs font-bold rounded-lg border ${
                         paymentMethod === method 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                       }`}
                     >
                       {method.replace('_', ' ')}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Total Amount</span>
                <span className="text-2xl font-bold text-slate-900">{settings.currency} {cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutComplete}
                className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
                  checkoutComplete 
                    ? 'bg-green-500 text-white' 
                    : cart.length === 0 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl'
                }`}
              >
                {checkoutComplete ? (
                  <>
                    <CheckCircle size={24} />
                    <span>Success!</span>
                  </>
                ) : (
                  <span>Confirm Sale</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'HISTORY' ? (
        /* HISTORY TAB (Reused existing code mostly) */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col relative">
          
          {selectedTransactionIds.size > 0 && (
            <div className="bg-slate-900 text-white p-4 absolute top-4 left-4 right-4 rounded-xl shadow-lg flex justify-between items-center z-20 animate-fade-in">
              <div className="flex items-center space-x-4">
                <span className="font-bold">{selectedTransactionIds.size} Selected</span>
                <button onClick={() => setSelectedTransactionIds(new Set())} className="text-slate-400 hover:text-white text-sm">Cancel</button>
              </div>
              <button onClick={handleBulkDeleteTransactions} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors">
                <Trash2 size={16} /> <span>Delete Selected</span>
              </button>
            </div>
          )}

          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
             <div className="flex items-center gap-4 justify-between">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-primary" /> Recorded Sales</h3>
               <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{salesTransactions.length} Transactions</span>
             </div>
             
             <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
                </div>
                
                {/* Time Range Presets */}
                <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    {(['ALL', '1D', '7D', '2W', '1M', '1Q', '1Y'] as const).map(tr => (
                        <button
                            key={tr}
                            onClick={() => { setHistoryTimeRange(tr); setDateFilter({start: '', end: ''}); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${historyTimeRange === tr && !dateFilter.start && !dateFilter.end ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                        >
                            {tr === 'ALL' ? 'All Time' : tr}
                        </button>
                    ))}
                </div>
                
                <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
                
                {/* Advanced Filters */}
                <div className="flex gap-3 w-full lg:w-auto items-center flex-wrap">
                    <div className="relative flex-1 lg:flex-none">
                        <select 
                            className="w-full lg:w-auto appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 outline-none focus:border-primary shadow-sm min-w-[140px]"
                            value={historyPaymentMethod}
                            onChange={(e) => setHistoryPaymentMethod(e.target.value as any)}
                        >
                            <option value="ALL">All Payment Methods</option>
                            {Object.values(PaymentMethod).map(m => (
                                <option key={m} value={m}>{m.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex-1 lg:flex-none">
                            <Calendar size={14} className="text-slate-400 ml-1 mr-2" />
                            <input type="date" className="outline-none text-sm font-medium text-slate-600 bg-transparent w-full" value={dateFilter.start} onChange={e => {setDateFilter(prev => ({...prev, start: e.target.value})); setHistoryTimeRange('ALL');}}/>
                        </div>
                        <span className="text-slate-400 text-xs font-bold w-4 text-center">-</span>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex-1 lg:flex-none">
                            <input type="date" className="outline-none text-sm font-medium text-slate-600 bg-transparent w-full pl-1" value={dateFilter.end} onChange={e => {setDateFilter(prev => ({...prev, end: e.target.value})); setHistoryTimeRange('ALL');}}/>
                        </div>
                    </div>

                    {(dateFilter.start || dateFilter.end || historyTimeRange !== 'ALL' || historyPaymentMethod !== 'ALL') && (
                        <button 
                            onClick={() => {setDateFilter({start: '', end: ''}); setHistoryTimeRange('ALL'); setHistoryPaymentMethod('ALL');}} 
                            className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 hover:border-red-200 flex items-center gap-1 shadow-sm" 
                            title="Clear Filters"
                        >
                            <RotateCcw size={14} /> Clear
                        </button>
                    )}
                </div>
             </div>
          </div>
          <div className="flex-1 overflow-auto">
             <div className="min-w-[600px] md:min-w-0">
                <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 text-sm">
                    <tr>
                    <th className="px-6 py-3 w-12">
                        <button onClick={handleSelectAllTransactions} className="flex items-center text-slate-400 hover:text-slate-600">
                        {salesTransactions.length > 0 && selectedTransactionIds.size === salesTransactions.length ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                    </th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Items</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {salesTransactions.map(t => {
                        const isSelected = selectedTransactionIds.has(t.id);
                        return (
                        <tr key={t.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-4">
                            <button onClick={() => handleSelectTransaction(t.id)} className={`flex items-center ${isSelected ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}>
                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                            {new Date(t.date).toLocaleString()}
                            {t.source === 'ONLINE' && <span className="block text-[10px] text-indigo-600 font-bold">ONLINE ORDER</span>}
                            {t.status === 'CANCELLED' && <span className="block text-[10px] text-red-600 font-bold">CANCELLED</span>}
                            {t.notes && <div className="text-xs text-slate-400 mt-1 max-w-[150px] truncate">Note: {t.notes}</div>}
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                {t.items.map((item, idx) => (
                                <span key={idx} className={`text-sm font-medium ${item.isPromotion ? 'text-purple-700' : 'text-slate-800'}`}>
                                    {item.productName} <span className="text-slate-500">x{item.quantity}</span>
                                </span>
                                ))}
                            </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                {t.paymentStatus || t.paymentMethod}
                            </span>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${t.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{settings.currency} {t.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditTransaction(t)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded transition-colors" title="Edit Record"><Edit2 size={16} /></button>
                                <button onClick={() => handleVoidTransaction(t)} className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors text-xs font-bold border border-red-200 hover:border-red-300 flex items-center gap-1" title="Void Transaction"><RotateCcw size={14} /> Void</button>
                            </div>
                            </td>
                        </tr>
                        );
                    })}
                    {salesTransactions.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">No sales found for selected period.</td></tr>
                    )}
                </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : null}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && editingTransaction && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">Edit Transaction</h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Calendar size={14}/> Date & Time</label>
                    <input type="datetime-local" className="w-full p-2 border border-slate-300 rounded-lg outline-none" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><CreditCard size={14}/> Payment Method</label>
                    <select className="w-full p-2 border border-slate-300 rounded-lg outline-none" value={editForm.paymentMethod} onChange={e => setEditForm({...editForm, paymentMethod: e.target.value as PaymentMethod})}>
                       {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><StickyNote size={14}/> Notes</label>
                    <textarea className="w-full p-2 border border-slate-300 rounded-lg outline-none h-24 resize-none" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Optional notes about this sale..."/>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                     <button onClick={saveTransactionEdit} className="flex-1 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium flex justify-center items-center gap-2"><Save size={18} /> Save Changes</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {selectedCustomerForHistory && (
         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <History size={18} /> {selectedCustomerForHistory.name}'s Order History
                  </h3>
                  <button onClick={() => setSelectedCustomerForHistory(null)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                  <div className="space-y-4">
                     {data.transactions
                       .filter(t => t.deliveryDetails?.customerPhone === selectedCustomerForHistory.phone || t.deliveryDetails?.customerName === selectedCustomerForHistory.name)
                       .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                       .map(order => (
                       <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {order.status || 'COMPLETED'}
                                  </span>
                                  <p className="text-xs text-slate-500 font-mono mt-2">{new Date(order.date).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                  <span className="font-black text-lg text-slate-800">{settings.currency}{order.totalAmount.toFixed(2)}</span>
                              </div>
                           </div>
                           <div className="mt-3">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Items</p>
                               <ul className="text-sm text-slate-600 space-y-1">
                                   {order.items.map((item, i) => (
                                       <li key={i} className="flex justify-between">
                                           <span>{item.quantity}x {item.productName}</span>
                                           <span className="font-medium">{settings.currency}{(item.priceAtMoment * item.quantity).toFixed(2)}</span>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       </div>
                     ))}
                     {data.transactions.filter(t => t.deliveryDetails?.customerPhone === selectedCustomerForHistory.phone || t.deliveryDetails?.customerName === selectedCustomerForHistory.name).length === 0 && (
                         <div className="text-center text-slate-400 py-10">
                            No orders found for this customer.
                         </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}

      <ConfirmModal 
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      </div>

      {receiptData && (
          <div className="hidden print:block absolute top-0 left-0 w-full min-h-full bg-white z-[9999] p-8 text-black" style={{ fontFamily: 'monospace' }}>
              <div className="max-w-md mx-auto print:mx-0 p-4 border border-slate-300 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2 uppercase text-center">{settings.storeName || 'Receipt'}</h2>
                  <p className="mb-4 text-xs text-center border-b border-dashed border-slate-300 pb-2">Date: {receiptData.date}</p>
                  
                  <div className="py-2">
                      <div className="flex justify-between text-xs font-bold border-b border-slate-300 pb-1 mb-2">
                          <span>Item</span>
                          <span>Amount</span>
                      </div>
                      {receiptData.items.map((item, i) => (
                          <div key={i} className="flex justify-between mb-2 pb-2 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                               <div className="text-left text-sm max-w-[70%]">
                                    <span className="font-bold">{item.quantity}x</span> {item.name}
                                    {item.discount > 0 && <span className="block text-xs mt-0.5">({item.discount}% Off applied)</span>}
                               </div>
                               <div className="text-right text-sm">
                                    {settings.currency}{((item.sellPrice * (1 - item.discount / 100)) * item.quantity).toFixed(2)}
                               </div>
                          </div>
                      ))}
                  </div>

                  <div className="border-t-2 border-slate-800 py-3 mt-2 flex justify-between items-center">
                      <span className="font-bold text-lg">TOTAL</span>
                      <span className="font-black text-xl">{settings.currency}{receiptData.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-2 text-xs uppercase text-center text-slate-500 font-bold border-t border-slate-200 pt-3">
                      Payment Method: {receiptData.method.replace('_', ' ')}
                  </div>
                  <div className="mt-6 text-center text-sm font-bold opacity-80 pb-4">
                      Thank you for your purchase!
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sales;
