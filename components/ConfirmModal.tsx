import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            </div>
          </div>
          
          <p className="text-slate-600 mb-6 pl-14 whitespace-pre-line">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end mt-4">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
              }}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 shadow-sm hover:shadow' 
                  : 'bg-primary hover:bg-secondary'
              }`}
            >
              {isDestructive && <Trash2 size={16} />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
