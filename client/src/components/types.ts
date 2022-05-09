import { PlaidLinkOnSuccessMetadata } from 'react-plaid-link';

// reserved for types
export interface TransferSuccessMetadata extends PlaidLinkOnSuccessMetadata {
  transfer_status: string;
}
export interface RouteInfo {
  userId: string;
}

export interface ItemType {
  id: number;
  plaid_item_id: string;
  user_id: number;
  plaid_access_token: string;
  plaid_institution_id: string;
  plaid_account_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransferType {
  id: number;
  item_id: number;
  user_id: number;
  plaid_account_id: string;
  destination_account_id: string;
  transfer_intent_id: string;
  authorization_id: string;
  transfer_id: string;
  amount: number;
  status: string;
  sweep_status: string;
  created_at: string;
  updated_at: string;
}

export interface AccountType {
  id: number;
  item_id: number;
  user_id: number;
  plaid_account_id: string;
  name: string;
  subtype: 'checking' | 'savings';
  created_at: string;
  updated_at: string;
}
export interface UserType {
  id: number;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentType {
  id: number;
  user_id: number;
  payments_total: number;
  monthly_payment: number;
  number_of_payments: number;
  created_at: string;
  updated_at: string;
}

export interface AppStatusType {
  id: number;
  number_of_events: number;
  app_account_balance: number;
  created_at: string;
  updated_at: string;
}

export interface StatusType {
  [key: string]: string;
}
