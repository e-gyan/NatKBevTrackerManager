
import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Settings as SettingsIcon, TrendingUp, BookOpen, Globe } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  pendingOnlineOrdersCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, pendingOnlineOrdersCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales & Orders', icon: ShoppingCart },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'insights', label: 'AI Insights', icon: TrendingUp },
    { id: 'documentation', label: 'System Docs', icon: BookOpen }, 
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10 hidden md:flex print:hidden">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-primary-400">BevTracker</h1>
        <p className="text-xs text-slate-400 mt-1">Wholesale Manager</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-white font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.id === 'sales' && pendingOnlineOrdersCount > 0 && (
                <span className={`${isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'} px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse`}>
                  {pendingOnlineOrdersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => onNavigate('storefront')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
        >
          <Globe size={18} />
          <span>View Public Website</span>
        </button>
        <div className="flex items-center space-x-2 text-slate-400 text-sm mt-4 justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
