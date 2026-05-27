
import { AppData, Settings, Product, Transaction, Expense, Promotion, AIChat, Customer } from '../types';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

const LS_KEY_SETTINGS = 'bev_tracker_settings';
const DEFAULT_PIN_HASH = '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5';

const DEFAULT_SETTINGS: Settings = {
  jsonBinId: '',
  jsonBinKey: '',
  currency: 'GHS',
  inventoryCategories: ['Soft Drinks', 'Beer', 'Spirits', 'Water', 'Snacks', 'Groceries', 'Toiletries'],
  productSizes: ['Can (330ml)', 'Bottle (500ml)', 'Bottle (750ml)', 'Pack (6)', 'Crate (24)', 'Bag (5kg)', 'Piece'],
  expenseCategories: ['Transport', 'Packaging', 'Marketing', 'Utilities', 'Rent', 'Salaries', 'Other'],
  securityPin: DEFAULT_PIN_HASH,
  viewMode: 'standard',
  geminiApiKey: ''
};

export const hashString = async (text: string): Promise<string> => {
  if (!text) return '';
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getStoredSettings = (): Settings => {
  const stored = localStorage.getItem(LS_KEY_SETTINGS);
  if (!stored) return DEFAULT_SETTINGS;
  const parsed = JSON.parse(stored);
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(settings));
};

export const getInitialData = (): AppData => {
  return { products: [], transactions: [], expenses: [], promotions: [], aiChats: [], customers: [] };
};

let cachedDataStr = JSON.stringify(getInitialData());

export const loadData = async (settings: Settings): Promise<AppData | null> => {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;
    const data = getInitialData();
    
    try {
        const fetchCollection = async (col: string) => {
            const snapshot = await getDocs(collection(db, 'users', uid, col));
            return snapshot.docs.map(doc => doc.data());
        };

        data.products = await fetchCollection('products') as Product[];
        data.transactions = await fetchCollection('transactions') as Transaction[];
        data.expenses = await fetchCollection('expenses') as Expense[];
        data.promotions = await fetchCollection('promotions') as Promotion[];
        data.aiChats = await fetchCollection('aiChats') as AIChat[];
        data.customers = await fetchCollection('customers') as Customer[];

        cachedDataStr = JSON.stringify(data);
        return data;
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/*`);
        return null;
    }
};

export const saveData = async (newData: AppData, settings: Settings): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;

    try {
        const oldData: AppData = JSON.parse(cachedDataStr);
        const diffAndSync = async (colName: string, oldItems: any[], newItems: any[]) => {
            const oldMap = new Map(oldItems.map(i => [i.id, i]));
            const newMap = new Map(newItems.map(i => [i.id, i]));
            
            const batch = writeBatch(db);
            let operationsCount = 0;

            const commitBatch = async () => {
                 if (operationsCount > 0) {
                     await batch.commit();
                     operationsCount = 0;
                 }
            };

            for (const item of newItems) {
                const oldItem = oldMap.get(item.id);
                if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
                    batch.set(doc(db, 'users', uid, colName, item.id), item);
                    operationsCount++;
                    if (operationsCount >= 400) await commitBatch();
                }
            }

            for (const item of oldItems) {
                if (!newMap.has(item.id)) {
                    batch.delete(doc(db, 'users', uid, colName, item.id));
                    operationsCount++;
                    if (operationsCount >= 400) await commitBatch();
                }
            }
            await commitBatch();
        };

        await Promise.all([
            diffAndSync('products', oldData.products, newData.products),
            diffAndSync('transactions', oldData.transactions, newData.transactions),
            diffAndSync('expenses', oldData.expenses, newData.expenses),
            diffAndSync('promotions', oldData.promotions, newData.promotions),
            diffAndSync('aiChats', oldData.aiChats, newData.aiChats),
            diffAndSync('customers', oldData.customers, newData.customers)
        ]);

        cachedDataStr = JSON.stringify(newData);
        return true;
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${uid}/*`);
        return false;
    }
};
