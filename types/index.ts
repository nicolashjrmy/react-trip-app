export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  username: string;
  following: number;
  followers: number;
}

export interface Trip {
  id: number;
  title: string;
  destination:string;
  participant: string[];
  desc?: string;
  createdBy: number;
  createdAt: string;
  isComplete: boolean;
  isArchive: boolean;
}

export interface Expense {
  id: number;
  name: string;
  desc?: string;
  amount: number;
  paidBy: string;
  countParticipant: number;
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

export interface Following {
  id: number;
  username: string;
  name: string;
}

export interface Follower {
  id: number;
  username: string;
  name: string;
}

export interface Participant {
  id: string;
  username: string;
  name: string;
}

export interface ParticipantWithStatus {
  id: number;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  isInvited?: boolean;
  joinedAt?: string;
}