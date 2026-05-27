
export interface Product {
  id: string;
  name: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  category: string;
  barcode?: string; // New field for barcode scanner
  size?: string; // New field
  defaultDiscount?: number; // New field
  isArchived?: boolean; // New field for soft delete
  lastPriceUpdate?: string; 
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  items: { productId: string; quantity: number }[];
  isActive: boolean;
}

export interface AIChat {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  category?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  joinedDate: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount: number; // Percentage
  isPromotion?: boolean;
  promotionItems?: { productId: string; quantity: number }[];
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER'
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'PURCHASE'; 
  source?: 'POS' | 'ONLINE'; // Distinguish where sale came from
  status?: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED'; // Added REFUNDED
  deliveryMode?: 'PICKUP' | 'DELIVERY';
  momoDetails?: {
    network: 'MTN' | 'TELECEL' | 'AT';
    number: string;
  };
  deliveryDetails?: {
    customerName: string;
    customerPhone: string;
    address: string;
  };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    priceAtMoment: number;
    buyPriceAtMoment: number;
    discount: number;
    isPromotion?: boolean;
    promotionItems?: { productId: string; quantity: number }[]; // Added to persist bundle makeup
  }[];
  totalAmount: number;
  profit: number; 
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; 
  date: string;
}

export interface AppData {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  promotions: Promotion[];
  aiChats: AIChat[];
  customers: Customer[]; // Database of consented customers
}

export interface Settings {
  jsonBinId: string;
  jsonBinKey: string;
  currency: string;
  inventoryCategories: string[];
  productSizes: string[]; // New field
  expenseCategories: string[];
  securityPin: string; 
  viewMode: 'standard' | 'wireframe';
}
