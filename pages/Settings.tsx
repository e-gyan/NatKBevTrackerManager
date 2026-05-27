
import React, { useState } from 'react';
import { Settings as SettingsType, AppData, Product, Transaction, PaymentMethod, Expense } from '../types';
import { hashString } from '../services/storage';
import { Save, Database, Tag, X, Plus, Download, Lock, Unlock, Shield, ShieldCheck, KeyRound, Monitor, PenTool, PlayCircle, Ruler } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  data: AppData;
  onUpdateData: (data: AppData) => void; 
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave, data, onUpdateData }) => {
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [message, setMessage] = useState('');
  const [newInvCat, setNewInvCat] = useState('');
  const [newExpCat, setNewExpCat] = useState('');
  const [newSize, setNewSize] = useState('');

  // Security State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'UNLOCK' | 'SETUP' | 'CHANGE'>('UNLOCK');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    onConfirm: () => {}
  });

  const handleSave = () => {
    onSave(formData);
    setMessage('Settings saved successfully!');
    setTimeout(() => setMessage(''), 3000);
    if (formData.securityPin) setIsUnlocked(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bev_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('Data exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  // --- DEMO DATA GENERATOR ---
  const generateDemoData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Load Demo Data',
      message: '⚠️ This is for portfolio demonstration. It will overwrite your current data with sample products and transactions. Are you sure you want to proceed?',
      isDestructive: true,
      onConfirm: () => {
        executeDemoDataLoad();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const executeDemoDataLoad = () => {
    const today = new Date();
    const daysAgo = (days: number) => {
      const d = new Date();
      d.setDate(today.getDate() - days);
      return d.toISOString();
    };

    // 1. Seed Products
    const demoProducts: Product[] = [
      { id: 'p1', name: 'Coca Cola', category: 'Soft Drinks', size: 'Can (330ml)', defaultDiscount: 0, buyPrice: 5, sellPrice: 7, stock: 42, minStock: 10, description: 'Classic soft drink.', lastPriceUpdate: daysAgo(10) },
      { id: 'p2', name: 'Club Beer', category: 'Beer', size: 'Bottle (500ml)', defaultDiscount: 1, buyPrice: 12, sellPrice: 15, stock: 15, minStock: 5, description: 'Refreshing lager.', lastPriceUpdate: daysAgo(40) },
      { id: 'p3', name: 'Bel Aqua Water', category: 'Water', size: 'Bottle (500ml)', defaultDiscount: 0, buyPrice: 1.5, sellPrice: 2.5, stock: 80, minStock: 20, description: 'Mineral water.', lastPriceUpdate: daysAgo(5) },
      { id: 'p4', name: 'Johnny Walker Black', category: 'Spirits', size: 'Label', defaultDiscount: 10, buyPrice: 150, sellPrice: 280, stock: 5, minStock: 3, description: 'Scotch whisky.', lastPriceUpdate: daysAgo(100) }, // Stale price
      { id: 'p5', name: 'Pringles Original', category: 'Snacks', size: 'Piece', defaultDiscount: 0, buyPrice: 40, sellPrice: 50, stock: 25, minStock: 8, description: 'Potato crisps.', lastPriceUpdate: daysAgo(2) },
    ];

    // 2. Seed Transactions (Dynamic Dates for Dashboard)
    const demoTransactions: Transaction[] = [
      // Recent Sales
      { 
        id: 't1', type: 'SALE', date: daysAgo(0), paymentMethod: PaymentMethod.MOMO, totalAmount: 135, profit: 60,
        items: [{ productId: 'p1', productName: 'Coca Cola', quantity: 3, priceAtMoment: 7, buyPriceAtMoment: 5, discount: 0 }] 
      },
      { 
        id: 't2', type: 'SALE', date: daysAgo(1), paymentMethod: PaymentMethod.CASH, totalAmount: 15, profit: 3,
        items: [{ productId: 'p2', productName: 'Club Beer', quantity: 1, priceAtMoment: 15, buyPriceAtMoment: 12, discount: 0 }] 
      },
      { 
        id: 't3', type: 'SALE', date: daysAgo(2), paymentMethod: PaymentMethod.MOMO, totalAmount: 105, profit: 30,
        items: [
            { productId: 'p3', productName: 'Bel Aqua Water', quantity: 2, priceAtMoment: 2.5, buyPriceAtMoment: 1.5, discount: 0 },
            { productId: 'p5', productName: 'Pringles Original', quantity: 2, priceAtMoment: 50, buyPriceAtMoment: 40, discount: 0 } // Price difference sim
        ] 
      },
      { 
        id: 't4', type: 'SALE', date: daysAgo(5), paymentMethod: PaymentMethod.CASH, totalAmount: 7, profit: 2,
        items: [{ productId: 'p1', productName: 'Coca Cola', quantity: 1, priceAtMoment: 7, buyPriceAtMoment: 5, discount: 0 }] 
      },
      // Older Sale
      { 
        id: 't5', type: 'SALE', date: daysAgo(12), paymentMethod: PaymentMethod.MOMO, totalAmount: 280, profit: 130,
        items: [{ productId: 'p4', productName: 'Johnny Walker Black', quantity: 1, priceAtMoment: 280, buyPriceAtMoment: 150, discount: 0 }] 
      },
    ];

    // 3. Seed Expenses
    const demoExpenses: Expense[] = [
      { id: 'e1', description: 'Restock Delivery (Okada)', amount: 30, category: 'Transport', date: daysAgo(1) },
      { id: 'e2', description: 'Packaging Bags', amount: 150, category: 'Packaging', date: daysAgo(4) },
      { id: 'e3', description: 'Instagram Ad Boost', amount: 50, category: 'Marketing', date: daysAgo(8) },
    ];

    onUpdateData({
      products: demoProducts,
      transactions: demoTransactions,
      expenses: demoExpenses,
      promotions: [],
      aiChats: [],
      customers: []
    });

    setMessage('Demo Data Loaded! Check Dashboard.');
    setTimeout(() => setMessage(''), 4000);
  };


  // --- Category Handlers ---
  const addInvCategory = () => {
    if (newInvCat && !formData.inventoryCategories.includes(newInvCat)) {
      setFormData({
        ...formData,
        inventoryCategories: [...formData.inventoryCategories, newInvCat]
      });
      setNewInvCat('');
    }
  };

  const removeInvCategory = (cat: string) => {
    setFormData({
      ...formData,
      inventoryCategories: formData.inventoryCategories.filter(c => c !== cat)
    });
  };

  const addSize = () => {
    if (newSize && !formData.productSizes.includes(newSize)) {
      setFormData({
        ...formData,
        productSizes: [...(formData.productSizes || []), newSize]
      });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({
      ...formData,
      productSizes: (formData.productSizes || []).filter(s => s !== size)
    });
  };

  const addExpCategory = () => {
    if (newExpCat && !formData.expenseCategories.includes(newExpCat)) {
      setFormData({
        ...formData,
        expenseCategories: [...formData.expenseCategories, newExpCat]
      });
      setNewExpCat('');
    }
  };

  const removeExpCategory = (cat: string) => {
    setFormData({
      ...formData,
      expenseCategories: formData.expenseCategories.filter(c => c !== cat)
    });
  };

  // --- Security Handlers ---
  const initiateUnlock = () => {
    if (!formData.securityPin) {
      setIsUnlocked(true); // No PIN set, just unlock
    } else {
      setPinAction('UNLOCK');
      setPinInput('');
      setShowPinModal(true);
    }
  };

  const initiatePinSetup = () => {
    setPinAction(formData.securityPin ? 'CHANGE' : 'SETUP');
    setPinInput('');
    setPinConfirm('');
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (pinAction === 'UNLOCK') {
      const hashedInput = await hashString(pinInput);
      if (hashedInput === formData.securityPin) {
        setIsUnlocked(true);
        setShowPinModal(false);
      } else {
        alert('Incorrect PIN');
        setPinInput('');
      }
    } else if (pinAction === 'SETUP' || pinAction === 'CHANGE') {
      if (pinInput.length < 4) {
        alert('PIN must be at least 4 digits');
        return;
      }
      if (pinInput !== pinConfirm) {
        alert('PINs do not match');
        return;
      }
      
      const hashedPin = await hashString(pinInput);
      setFormData({ ...formData, securityPin: hashedPin });
      setShowPinModal(false);
      setMessage(pinAction === 'SETUP' ? 'PIN Set! Click "Save Config" to finish.' : 'PIN Changed! Click "Save Config".');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <h2 className="text-2xl font-bold text-slate-800">System Configuration</h2>

      {/* PORTFOLIO DEMO SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 text-white flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
               <Monitor size={20} className="text-primary-400"/> Portfolio Demo Mode
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-lg">
               Are you a recruiter or reviewing this app? Click below to instantly populate the dashboard with realistic sample data (Products, Sales, Expenses) to see the system in action.
            </p>
         </div>
         <button 
           onClick={generateDemoData}
           className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105 active:scale-95"
         >
            <PlayCircle size={20} /> Load Demo Data
         </button>
      </div>

      {/* Security Banner */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${formData.securityPin ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {formData.securityPin ? <ShieldCheck size={24} /> : <Shield size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-700">Security Access</h3>
            <p className="text-xs text-slate-500">
              {formData.securityPin 
                ? "Admin PIN is active. Critical settings are protected." 
                : "No Admin PIN set. Settings are open to everyone."}
            </p>
          </div>
        </div>
        <button 
          onClick={initiatePinSetup}
          className="text-sm font-medium text-primary hover:text-secondary underline"
        >
          {formData.securityPin ? "Change PIN" : "Setup PIN"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
           <div className="flex items-center space-x-2">
             <Tag className="text-primary" size={24} />
             <h3 className="text-lg font-bold text-slate-700">Categories & Sizes</h3>
           </div>

           {/* Inventory Categories */}
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Inventory Types</label>
             <div className="flex flex-wrap gap-2 mb-2">
               {formData.inventoryCategories.map(cat => (
                 <span key={cat} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                   {cat}
                   <button onClick={() => removeInvCategory(cat)} className="hover:text-red-500"><X size={12}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 className="flex-1 p-2 border border-slate-300 rounded text-sm outline-none"
                 placeholder="New category..."
                 value={newInvCat}
                 onChange={e => setNewInvCat(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addInvCategory()}
               />
               <button onClick={addInvCategory} className="bg-slate-100 hover:bg-slate-200 p-2 rounded"><Plus size={16}/></button>
             </div>
           </div>

           {/* Product Sizes */}
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Product Sizes</label>
             <div className="flex flex-wrap gap-2 mb-2">
               {(formData.productSizes || []).map(size => (
                 <span key={size} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                   {size}
                   <button onClick={() => removeSize(size)} className="hover:text-red-500"><X size={12}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 className="flex-1 p-2 border border-slate-300 rounded text-sm outline-none"
                 placeholder="New size (e.g. XL)..."
                 value={newSize}
                 onChange={e => setNewSize(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addSize()}
               />
               <button onClick={addSize} className="bg-slate-100 hover:bg-slate-200 p-2 rounded"><Plus size={16}/></button>
             </div>
           </div>

           {/* Expense Categories */}
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Expense Types</label>
             <div className="flex flex-wrap gap-2 mb-2">
               {formData.expenseCategories.map(cat => (
                 <span key={cat} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                   {cat}
                   <button onClick={() => removeExpCategory(cat)} className="hover:text-red-500"><X size={12}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 className="flex-1 p-2 border border-slate-300 rounded text-sm outline-none"
                 placeholder="New category..."
                 value={newExpCat}
                 onChange={e => setNewExpCat(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addExpCategory()}
               />
               <button onClick={addExpCategory} className="bg-slate-100 hover:bg-slate-200 p-2 rounded"><Plus size={16}/></button>
             </div>
           </div>
        </div>

        {/* System Settings (Protected) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
          
          <div className="flex justify-between items-start">
             <div className="flex items-center space-x-2 mb-4">
               <Database className="text-primary" size={24} />
               <h3 className="text-lg font-bold text-slate-700">Data Storage</h3>
             </div>
             {formData.securityPin && (
               <button 
                onClick={() => setIsUnlocked(!isUnlocked)}
                className={`p-2 rounded-lg transition-colors ${isUnlocked ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}
                title={isUnlocked ? "Lock Settings" : "Unlock Settings"}
               >
                 {isUnlocked ? <Unlock size={20} /> : <Lock size={20} />}
               </button>
             )}
          </div>

          <p className="text-xs text-slate-500 mb-4">
            JSONBin.io Configuration for cloud sync.
            {!isUnlocked && formData.securityPin && " (Hidden for security)"}
          </p>

          <div className={`space-y-4 ${!isUnlocked && formData.securityPin ? 'opacity-50 blur-[2px] pointer-events-none select-none' : ''}`}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bin ID</label>
              <input 
                type={isUnlocked ? "text" : "password"}
                value={formData.jsonBinId}
                onChange={e => setFormData({...formData, jsonBinId: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono text-sm"
                placeholder="e.g. 660..."
                disabled={!isUnlocked && !!formData.securityPin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Master API Key</label>
              <input 
                type="password" 
                value={formData.jsonBinKey}
                onChange={e => setFormData({...formData, jsonBinKey: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono text-sm"
                placeholder="$2a$10$..."
                disabled={!isUnlocked && !!formData.securityPin}
              />
            </div>
          </div>

          {/* Lock Overlay */}
          {!isUnlocked && formData.securityPin && (
            <div className="absolute inset-0 z-10 flex items-center justify-center top-20 bg-white/30 backdrop-blur-sm">
               <button 
                 onClick={initiateUnlock}
                 className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
               >
                 <KeyRound size={18} /> Unlock Details
               </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
             <h4 className="text-sm font-medium text-slate-700 mb-2">Data Backup</h4>
             <button
                onClick={handleExport}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors border border-slate-200"
             >
               <Download size={18} /> Export Data (JSON)
             </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <h3 className="text-lg font-bold text-slate-700 mb-4">Preferences</h3>
             
             <div className="space-y-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                   <input 
                     type="text" 
                     value={formData.currency}
                     onChange={e => setFormData({...formData, currency: e.target.value})}
                     className="w-24 p-2 border border-slate-300 rounded-lg outline-none text-center"
                     placeholder="GHS"
                   />
               </div>

               {/* View Mode Toggle */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Presentation Mode</label>
                  <div className="flex items-center gap-4">
                     <button
                       onClick={() => setFormData({...formData, viewMode: 'standard'})}
                       className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                         formData.viewMode === 'standard' || !formData.viewMode 
                           ? 'border-primary bg-primary/5 text-primary font-bold' 
                           : 'border-slate-200 text-slate-500 hover:border-slate-300'
                       }`}
                     >
                        <Monitor size={18} /> Standard
                     </button>
                     <button
                       onClick={() => setFormData({...formData, viewMode: 'wireframe'})}
                       className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                         formData.viewMode === 'wireframe' 
                           ? 'border-black bg-black text-white font-bold' 
                           : 'border-slate-200 text-slate-500 hover:border-slate-300'
                       }`}
                     >
                        <PenTool size={18} /> Low-Fi / Wireframe
                     </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Switch to Low-Fi mode to take screenshots for mockups.</p>
               </div>
             </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-green-600 font-medium text-sm">{message}</span>
            <button 
              onClick={handleSave}
              className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Save size={18} />
              <span>Save Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">
                 {pinAction === 'UNLOCK' ? 'Enter Admin PIN' : 'Set Security PIN'}
               </h3>
               <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500">
                  {pinAction === 'UNLOCK' 
                    ? "Enter your security PIN to view/edit sensitive settings."
                    : "Create a PIN to protect your API keys and configuration."}
                </p>
                
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Enter PIN"
                  className="w-full p-3 text-center text-2xl tracking-widest border border-slate-300 rounded-lg outline-none focus:border-primary"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  maxLength={6}
                />

                {(pinAction === 'SETUP' || pinAction === 'CHANGE') && (
                  <input 
                    type="password" 
                    placeholder="Confirm PIN"
                    className="w-full p-3 text-center text-2xl tracking-widest border border-slate-300 rounded-lg outline-none focus:border-primary"
                    value={pinConfirm}
                    onChange={e => setPinConfirm(e.target.value)}
                    maxLength={6}
                  />
                )}

                <button 
                  onClick={handlePinSubmit}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  {pinAction === 'UNLOCK' ? 'Unlock' : 'Save PIN'}
                </button>
             </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Settings;
