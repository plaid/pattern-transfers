import axios from 'axios';
import { toast } from 'react-toastify';
import { PlaidLinkOnSuccessMetadata } from 'react-plaid-link';

const baseURL = '/';

const api = axios.create({
  baseURL,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: 0,
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    if (
      error?.response?.data?.message &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
);

export default api;
// appStatus
export const setAppStatus = () => api.get('/appStatus/initial');
export const getAppStatus = () => api.get('/appStatus/status');

// currentUser
export const getLoginUser = (username: string) =>
  api.post('/sessions', { username });

// users
export const getUsers = () => api.get('/users');
export const getUserById = (userId: number) => api.get(`/users/${userId}`);
export const addNewUser = (username: string) =>
  api.post('/users', { username });
export const updateIdentityCheckById = (
  userId: number,
  identityCheck: boolean
) => api.put(`/users/${userId}/identity_check`, { identityCheck });
export const updateUserInfo = (
  userId: number,
  fullname: string,
  email: string
) => api.put(`/users/${userId}/confirmation`, { fullname, email });
export const deleteUserById = (userId: number) =>
  api.delete(`/users/${userId}`);

export const createTransfer = (
  userId: number,
  itemId: number,
  subscriptionAmount: number
) => api.post(`/transfers/transfer`, { userId, itemId, subscriptionAmount });

export const getTransfersByUserId = (userId: number) =>
  api.get(`/users/${userId}/transfers`);

export const getTransferUIStatus = (intentId: string) =>
  api.post(`/transfers/transfer_ui/status`, { intentId });

export const getTransferStatus = (transferId: string, isTransferUI: boolean) =>
  api.post(`/transfers/transfer/status`, { transferId, isTransferUI });

export const addTransferInfo = (
  transferIntentId: string,
  accountId: string,
  transferId: string,
  status: string,
  sweepStatus: string,
  itemId: number,
  type: string
) =>
  api.put(`/transfers/${transferIntentId}/add_info`, {
    accountId,
    transferId,
    status,
    sweepStatus,
    itemId,
    type,
  });

export const simulateSweep = () => api.post(`/transfers/simulate_sweep`);

export const simulateTransferEvent = (transferId: string, event: string) =>
  api.post(`/transfers/simulate_event`, { transferId, event });

export const deleteTransfersByUserId = (userId: string) =>
  api.delete(`/transfers/${userId}`);

// events

export const fireTransferWebhook = () =>
  api.post(`/events/sandbox/fire_webhook`);

// payments

export const getPaymentsByUser = (userId: number) =>
  api.get(`/users/${userId}/payments`);
export const addPayment = (userId: number, paymentAmount: number) =>
  api.put(`/payments/${userId}/add_payment`, { paymentAmount });
export const setMonthlyPayment = (userId: number, monthlyPayment: number) =>
  api.put(`/payments/${userId}/set_monthly_payment`, { monthlyPayment });

// items
export const getItemById = (id: number) => api.get(`/items/${id}`);
export const getItemsByUser = (userId: number) =>
  api.get(`/users/${userId}/items`);
export const setItemState = (itemId: number, status: string) =>
  api.put(`items/${itemId}`, { status });
// This endpoint is only availble in the sandbox enviornment
export const setItemToBadState = (itemId: number) =>
  api.post('/items/sandbox/item/reset_login', { itemId });

export const getLinkToken = (userId: number, subscriptionAmount: number) =>
  api.post(`/link-token`, {
    userId,
    subscriptionAmount,
  });
export const makeTransfer = (
  fundingSourceUrl: string,
  amount: number,
  itemId: number
) => api.post(`/items/makeTransfer`, { fundingSourceUrl, amount, itemId });

// accounts
export const getBalanceByItem = (itemId: number, accountId: string) =>
  api.put(`/items/${itemId}/balance`, { accountId });
export const getAccountsByItem = (itemId: number) =>
  api.get(`/items/${itemId}/accounts`);
export const getAccountsByUser = (userId: number) =>
  api.get(`/users/${userId}/accounts`);

// institutions
export const getInstitutionById = (instId: string) =>
  api.get(`/institutions/${instId}`);

// misc
export const postLinkEvent = (event: any) => api.post(`/link-event`, event);

export const exchangeToken = async (
  publicToken: string,
  institution: any,
  accounts: PlaidLinkOnSuccessMetadata['accounts'],
  userId: number
) => {
  try {
    const { data } = await api.post('/items', {
      publicToken,
      institutionId: institution.institution_id,
      userId,
      accounts,
    });
    return data;
  } catch (err) {
    toast.error(`Error linking ${institution.name}`);
  }
};
