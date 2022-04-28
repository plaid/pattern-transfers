import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  Dispatch,
} from 'react';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';

import { PaymentType } from '../components/types';

import { getPaymentsByUser as apiGetPaymentsByUser } from './api';

interface PaymentsState {
  [paymentId: number]: PaymentType;
}

const initialState: PaymentsState = {};
type PaymentsAction =
  | {
      type: 'SUCCESSFUL_REQUEST';
      payload: PaymentType[];
    }
  | { type: 'SUCCESSFUL_DELETE'; payload: number }
  | { type: 'DELETE_BY_USER'; payload: number };

interface PaymentsContextShape extends PaymentsState {
  dispatch: Dispatch<PaymentsAction>;
  deletePaymentById: (id: number, userId: number) => void;
  getPaymentsByUser: (userId: number) => void;
  paymentsById: { [paymentId: number]: PaymentType[] };
  paymentsByUser: { [userId: number]: PaymentType[] };
  deletePaymentsByUserId: (userId: number) => void;
}
const PaymentsContext = createContext<PaymentsContextShape>(
  initialState as PaymentsContextShape
);

/**
 * @desc Maintains the Payments context state and provides functions to update that state.
 */
export function PaymentsProvider(props: any) {
  const [paymentsById, dispatch] = useReducer(reducer, {});

  /**
   * @desc Requests all Payments that belong to an individual User.
   */
  const getPaymentsByUser = useCallback(async userId => {
    const { data: payload } = await apiGetPaymentsByUser(userId);
    dispatch({ type: 'SUCCESSFUL_REQUEST', payload: payload });
  }, []);

  /**
   * @desc Will deletes Payment by paymentId.
   */
  const deletePaymentById = useCallback(async (id, userId) => {
    // will add this function in later
    // await apiDeletePaymentById(id);
    // dispatch({ type: 'SUCCESSFUL_DELETE', payload: id });
    // // Update payments list after deletion.
    // await getPaymentsByUser(userId);
    // delete hasRequested.current.byId[id];
  }, []);

  /**
   * @desc Will delete all payments that belong to an individual User.
   * There is no api request as apiDeletePaymentById in payments delete all related transactions
   */
  const deletePaymentsByUserId = useCallback(userId => {
    dispatch({ type: 'DELETE_BY_USER', payload: userId });
  }, []);

  /**
   * @desc Builds a more accessible state shape from the Payments data. useMemo will prevent
   * these from being rebuilt on every render unless paymentsById is updated in the reducer.
   */
  const value = useMemo(() => {
    const allPayments = Object.values(paymentsById);

    return {
      allPayments,
      paymentsById,
      paymentsByUser: groupBy(allPayments, 'user_id'),
      getPaymentsByUser,
      deletePaymentById,
      deletePaymentsByUserId,
    };
  }, [
    getPaymentsByUser,
    deletePaymentById,
    paymentsById,
    deletePaymentsByUserId,
  ]);

  return <PaymentsContext.Provider value={value} {...props} />;
}

/**
 * @desc Handles updates to the Payments state as dictated by dispatched actions.
 */
function reducer(state: PaymentsState, action: PaymentsAction) {
  switch (action.type) {
    case 'SUCCESSFUL_REQUEST':
      if (!action.payload.length) {
        return state;
      }
      return { ...state, ...keyBy(action.payload, 'id') };
    case 'SUCCESSFUL_DELETE':
      return omit(state, [action.payload]);
    case 'DELETE_BY_USER':
      return omitBy(state, payments => payments.user_id === action.payload);
    default:
      console.warn('unknown action');
      return state;
  }
}

/**
 * @desc A convenience hook to provide access to the Payments context state in components.
 */
export default function usePayments() {
  const context = useContext(PaymentsContext);

  if (!context) {
    throw new Error(`usePayments must be used within an PaymentsProvider`);
  }

  return context;
}
