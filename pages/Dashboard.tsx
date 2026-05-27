
import React, { useMemo, useState } from 'react';
import { AppData, Settings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, TrendingUp, AlertTriangle, Wallet, CalendarRange } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  settings: Settings;
}

type TimeRange = '1D' | '2W' | '1M' | '1Q' | '1Y';

const Dashboard: React.FC<DashboardProps> = ({ data, settings }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('2W');

  const stats = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    switch(timeRange) {
        case '1D': startDate.setDate(now.getDate() - 1); break;
        case '2W': startDate.setDate(now.getDate() - 14); break;
        case '1M': startDate.setDate(now.getDate() - 30); break;
        case '1Q': startDate.setDate(now.getDate() - 90); break;
        case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
    }
    
    // Set to beginning of day to include all txs from that day onwards
    startDate.setHours(0,0,0,0);

    const isInRange = (d: string) => new Date(d) >= startDate;

    // Filter Logic: Must be SALE, must be in date range, and if it has a payment status, it MUST be PAID.
    // Legacy transactions without paymentStatus are assumed PAID.
    const filteredSales = data.transactions.filter(t => 
        t.type === 'SALE' && 
        isInRange(t.date) &&
        (t.paymentStatus ? t.paymentStatus === 'PAID' : true) 
    );
    
    const totalSales = filteredSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalProfit = filteredSales.reduce((acc, curr) => acc + curr.profit, 0);
    const totalExpenses = data.expenses.filter(e => isInRange(e.date)).reduce((acc, curr) => acc + curr.amount, 0);
    
    const netProfit = totalProfit - totalExpenses;

    // Inventory stats are point-in-time, so we show current status regardless of time range
    const lowStockCount = data.products.filter(p => p.stock <= p.minStock).length;
    const inventoryCost = data.products.reduce((acc, p) => acc + (p.buyPrice * p.stock), 0);
    const inventoryPotentialRevenue = data.products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0);
    const inventoryPotentialProfit = inventoryPotentialRevenue - inventoryCost;

    return { 
      totalSales, 
      netProfit, 
      lowStockCount, 
      totalExpenses, 
      inventoryCost, 
      inventoryPotentialRevenue,
      inventoryPotentialProfit 
    };
  }, [data, timeRange]);

  const salesData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let groupByMonth = false;

    switch(timeRange) {
        case '1D': startDate.setDate(now.getDate() - 1); break;
        case '2W': startDate.setDate(now.getDate() - 14); break;
        case '1M': startDate.setDate(now.getDate() - 30); break;
        case '1Q': startDate.setDate(now.getDate() - 90); break;
        case '1Y': startDate.setFullYear(now.getFullYear() - 1); groupByMonth = true; break;
    }
    startDate.setHours(0,0,0,0);

    const filtered = data.transactions.filter(t => 
        t.type === 'SALE' && 
        new Date(t.date) >= startDate &&
        (t.paymentStatus ? t.paymentStatus === 'PAID' : true)
    );
    
    // Create aggregations
    const groups: {[key: string]: number} = {};
    
    // Pre-fill keys to ensure continuous axis
    if (!groupByMonth) {
        // Fill Daily
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            groups[key] = 0;
        }
    } else {
        // Fill Monthly
         for (let d = new Date(startDate); d <= now; d.setMonth(d.getMonth() + 1)) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            groups[key] = 0;
         }
    }

    filtered.forEach(t => {
        const d = new Date(t.date);
        let key = '';
        if (groupByMonth) {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = d.toISOString().split('T')[0];
        }
        
        // Only add if key exists in our pre-filled range (safeguard) or add new
        if (groups[key] !== undefined) {
             groups[key] += t.totalAmount;
        } else {
             groups[key] = t.totalAmount;
        }
    });

    return Object.entries(groups).map(([date, amount]) => ({
        date: groupByMonth ? date : date.slice(5), // Remove Year for daily to save space
        amount
    })).sort((a,b) => a.date.localeCompare(b.date)); // Simple string sort works for ISO formats YYYY-MM and MM-DD
  }, [data, timeRange]);

  const timeRangeLabel = {
    '1D': 'Last 24 Hours',
    '2W': 'Last 2 Weeks',
    '1M': 'Last 30 Days',
    '1Q': 'Last Quarter',
    '1Y': 'Last Year'
  }[timeRange];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Business Overview</h2>
          <p className="text-sm text-slate-500">Performance for {timeRangeLabel}</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           {(['1D', '2W', '1M', '1Q', '1Y'] as TimeRange[]).map((r) => (
             <button
               key={r}
               onClick={() => setTimeRange(r)}
               className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                 timeRange === r 
                   ? 'bg-slate-800 text-white shadow' 
                   : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
               }`}
             >
               {r}
             </button>
           ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Sales ({timeRange})</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {settings.currency} {stats.totalSales.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Net Profit ({timeRange})</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {settings.currency} {stats.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Deducted {settings.currency}{stats.totalExpenses} expenses</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value (Cost)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {settings.currency} {stats.inventoryCost.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Current capital tied in stock</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.lowStockCount}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Valuation Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Capital vs Revenue ({timeRange})</h3>
            <div className="space-y-6">
              {/* Progress bar for Revenue vs Inventory Cost */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Period Sales vs Current Stock Value</span>
                  <span className="font-bold text-slate-800">
                    {Math.round((stats.totalSales / (stats.inventoryCost + stats.totalSales || 1)) * 100)}% Recouped
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                   <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(stats.totalSales / (stats.totalSales + stats.inventoryCost || 1)) * 100}%` }}
                      title={`Sales: ${settings.currency}${stats.totalSales}`}
                   ></div>
                   <div 
                      className="bg-orange-400 h-full" 
                      style={{ width: `${(stats.inventoryCost / (stats.totalSales + stats.inventoryCost || 1)) * 100}%` }}
                      title={`Stock Cost: ${settings.currency}${stats.inventoryCost}`}
                   ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Sales Collected</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full"></div> Stock Value (Cost)</div>
                </div>
              </div>

              {/* Potential Profit */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-medium text-slate-500 mb-2">Projected Performance (If all current stock sold)</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-slate-400">Total Potential Revenue</div>
                    <div className="text-lg font-bold text-slate-700">{settings.currency} {stats.inventoryPotentialRevenue.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Potential Profit in Stock</div>
                    <div className="text-lg font-bold text-green-600">+{settings.currency} {stats.inventoryPotentialProfit.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
         </div>

         {/* Sales Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Trend</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} minTickGap={10} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${settings.currency} ${value}`, 'Sales']}
                />
                <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-y-auto max-h-[400px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Low Stock Warning</h3>
        {data.products.filter(p => p.stock <= p.minStock).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Package size={32} className="mb-2 opacity-50" />
            <p>All stock levels are healthy</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 rounded-tl-lg">Product</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2 rounded-tr-lg">Min Level</th>
              </tr>
            </thead>
            <tbody>
              {data.products
                .filter(p => p.stock <= p.minStock)
                .map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{p.stock}</td>
                    <td className="px-4 py-3 text-slate-500">{p.minStock}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
