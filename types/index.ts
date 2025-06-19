export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Trip {
  id: number;
  name: string;
  description?: string;
  budget?: number;
  createdAt: string;
}

export interface Expense {
  id: number;
  name: string;
  desc?: string;
  amount: number;
  paidBy: number;
  participants: number[];
  customSplits?: CustomSplit[];
  additionalFees?: AdditionalFee[];
  splitType?: 'equal' | 'custom';
}

export interface CustomSplit {
  userId: number;
  name: string;
  amount: number;
}

export interface AdditionalFee {
  name: string;
  amount: number;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}