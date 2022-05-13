import React, {
  useCallback,
  useContext,
  useMemo,
  useReducer,
  Dispatch,
  createContext,
} from 'react';

import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import omitBy from 'lodash/omitBy';

import { TransferType } from '../components/types';

import {
  getTransfersByUserId as apiGetTransfersByUserId,
  deleteTransfersByUserId as apiDeleteTransfersByUserId,
} from './api';

interface TransfersState {
  [transferId: number]: TransferType;
}

const initialState = {};
type TransfersAction =
  | { type: 'SUCCESSFUL_GET'; id: number; transfers: TransferType[] }
  | { type: 'DELETE_BY_USER'; payload: number };

interface TransfersContextShape extends TransfersState {
  dispatch: Dispatch<TransfersAction>;
  transfersById: { [transferId: number]: TransferType[] };
  transfersByUser: {
    [userId: number]: TransferType[];
  };
  getTransfersByUser: (userId: number) => TransferType[];
  deleteTransfersByUserId: (userId: number) => void;
}
const TransfersContext = createContext<TransfersContextShape>(
  initialState as TransfersContextShape
);

/**
 * @desc Maintains the Transfers context state.
 */
export function TransfersProvider(props: any) {
  const [transfersById, dispatch] = useReducer(reducer, initialState);

  /**
   * @desc Requests all Transfers that belong to an individual User.
   */
  const getTransfersByUser = useCallback(async userId => {
    if (userId != null) {
      const { data: transfers } = await apiGetTransfersByUserId(userId);
      dispatch({ type: 'SUCCESSFUL_GET', id: userId, transfers: transfers });
    }
  }, []);

  /**
   * @desc Will delete all transfers that belong to an individual User.
   */
  const deleteTransfersByUserId = useCallback(async userId => {
    await apiDeleteTransfersByUserId(userId);
    await dispatch({ type: 'DELETE_BY_USER', payload: userId });
  }, []);

  const value = useMemo(() => {
    const allTransfers = Object.values(transfersById);
    return {
      allTransfers,
      transfersById,
      transfersByUser: groupBy(allTransfers, 'user_id'),

      getTransfersByUser,
      deleteTransfersByUserId,
    };
  }, [transfersById, getTransfersByUser, deleteTransfersByUserId]);

  return <TransfersContext.Provider value={value} {...props} />;
}

/**
 * @desc Handles updates to the Transfer state as dictated by dispatched actions.
 */
function reducer(state: any, action: TransfersAction) {
  switch (action.type) {
    case 'SUCCESSFUL_GET':
      if (!action.transfers.length) {
        return state;
      }
      return {
        ...state,
        ...keyBy(action.transfers, 'id'),
      };
    case 'DELETE_BY_USER':
      const transfers = state.transfersById;
      return {
        ...state,
        transfersById: omitBy(
          transfers,
          transfer => transfer.user_id === action.payload
        ),
      };
    default:
      console.warn('unknown action');
      return state;
  }
}

/**
 * @desc A convenience hook to provide access to the Transfer context state in components.
 */
export default function useTransfers() {
  const context = useContext(TransfersContext);
  if (!context) {
    throw new Error(`useTransfers must be used within a TransfersProvider`);
  }

  return context;
}
