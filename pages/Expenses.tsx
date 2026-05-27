import React, { useState } from 'react';
import { AppData, Expense, Settings } from '../types';
import { Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface ExpensesProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
  settings: Settings;
}

const Expenses: React.FC<ExpensesProps> = ({ data, onUpdate, settings }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(settings.expenseCategories[0] || 'Other');
  
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

  const handleAddExpense = () => {
    if (!description || !amount) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount: Number(amount),
      category,
      date: new Date().toISOString()
    };

    onUpdate({
      ...data,
      expenses: [newExpense, ...data.expenses]
    });

    setDescription('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense record? This action cannot be undone.',
      isDestructive: true,
      onConfirm: () => {
        onUpdate({
          ...data,
          expenses: data.expenses.filter(e => e.id !== id)
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Operational Expenses</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Record New Expense</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Taxi to market"
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Amount ({settings.currency})</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none appearance-none bg-white"
                >
                  {settings.expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Tag className="absolute right-3 top-2.5 text-slate-400" size={16} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Manage categories in Settings</p>
            </div>
            <button
              onClick={handleAddExpense}
              className="w-full bg-primary hover:bg-secondary text-white py-2 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Record Expense
            </button>
          </div>
        </div>

        {/* Expense List */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Recent History</h3>
            <span className="text-sm font-mono font-bold bg-slate-200 px-3 py-1 rounded text-slate-700">
              Total: {settings.currency} {data.expenses.reduce((a, b) => a + b.amount, 0).toFixed(2)}
            </span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{expense.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">
                      {settings.currency} {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(expense.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">No expenses recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Expenses;