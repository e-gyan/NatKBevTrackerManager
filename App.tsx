
import React, { useState, useEffect } from 'react';
import { AppData, Settings as SettingsType } from './types';
import { getInitialData, loadData, saveData, getStoredSettings, saveSettings } from './services/storage';
import { subscribeToAuthChanges, signInWithGoogle, signOut } from './services/firebase';
import { User } from 'firebase/auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import SettingsPage from './pages/Settings';
import Insights from './pages/Insights';
import Documentation from './pages/Documentation';
import Storefront from './pages/Storefront';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, TrendingUp, Settings as SettingsIcon, BookOpen, Globe, Store } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [data, setData] = useState<AppData>(getInitialData());
  const [settings, setSettings] = useState<SettingsType>(getStoredSettings());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const pendingOnlineOrdersCount = data.transactions.filter(t => t.source === 'ONLINE' && t.status === 'PENDING').length;
  const prevPendingOnlineOrdersCountRef = React.useRef(pendingOnlineOrdersCount);

  // Play sound when new online order arrives
  useEffect(() => {
    if (pendingOnlineOrdersCount > prevPendingOnlineOrdersCountRef.current) {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
            }
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }
    prevPendingOnlineOrdersCountRef.current = pendingOnlineOrdersCount;
  }, [pendingOnlineOrdersCount]);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
        setUser(u);
        if (u) {
            loadData(settings).then(loadedData => {
                if (loadedData) setData(loadedData);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply Wireframe Mode
  useEffect(() => {
    if (settings.viewMode === 'wireframe') {
      document.body.classList.add('wireframe-mode');
    } else {
      document.body.classList.remove('wireframe-mode');
    }
  }, [settings.viewMode]);

  // Save Data when changed
  const handleDataUpdate = (newData: AppData) => {
    setData(newData);
    saveData(newData, settings);
  };

  const handleSettingsUpdate = (newSettings: SettingsType) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={data} settings={settings} />;
      case 'inventory':
        return <Inventory data={data} onUpdate={handleDataUpdate} settings={settings} />;
      case 'sales':
        return <Sales data={data} onUpdate={handleDataUpdate} settings={settings} />;
      case 'expenses':
        return <Expenses data={data} onUpdate={handleDataUpdate} settings={settings} />;
      case 'insights':
        // Passed onUpdate here
        return <Insights data={data} settings={settings} onUpdate={handleDataUpdate} />;
      case 'documentation':
        return <Documentation />;
      case 'settings':
        return <SettingsPage settings={settings} onSave={handleSettingsUpdate} data={data} onUpdateData={handleDataUpdate} />;
      case 'storefront':
        return <Storefront data={data} settings={settings} onUpdate={handleDataUpdate} onBackToAdmin={() => setCurrentPage('dashboard')} />;
      default:
        return <Dashboard data={data} settings={settings} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'expenses', label: 'Costs', icon: DollarSign },
    { id: 'settings', label: 'Config', icon: SettingsIcon },
    // { id: 'storefront', label: 'Store', icon: Globe }, // Hidden in mobile bottom nav to keep it admin focused
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading BevTracker...</p>
        </div>
      </div>
    );
  }

  if (!user && currentPage !== 'storefront') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <Package size={64} className="text-primary mb-4" />
            <h1 className="text-2xl font-black text-slate-800 mb-2">Welcome to BevTracker</h1>
            <p className="text-slate-500 mb-8">Sign in with Google to access your store dashboard and sync data reliably with Firebase.</p>
            <button 
                onClick={signInWithGoogle}
                className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
                <Store size={20} />
                Sign In with Google
            </button>
        </div>
      </div>
    );
  }

  // Full Screen layout for Storefront
  if (currentPage === 'storefront') {
      return (
          <div className="min-h-screen bg-white">
              {renderPage()}
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row max-w-[100vw] overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} pendingOnlineOrdersCount={pendingOnlineOrdersCount} />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-80px)] md:min-h-screen pb-24 md:pb-8 overflow-y-auto w-full max-w-full">
        {renderPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 px-2 py-2 shadow-lg safe-area-bottom">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                  isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                {item.id === 'sales' && pendingOnlineOrdersCount > 0 && (
                  <span className="absolute top-1 right-2 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {pendingOnlineOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
