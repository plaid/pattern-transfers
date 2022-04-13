import React, {
  useCallback,
  useContext,
  useMemo,
  useReducer,
  Dispatch,
  createContext,
} from 'react';

import { PlaidLinkError } from 'react-plaid-link';

import { getTransferIntentId } from './api';

interface TransferState {
  transfer_intent_id: string;
}

const initialState = {
  transfer_intent_id: null,
};
type TransferAction =
  | {
      type: 'SET_TRANSFER_INTENT_ID';
      transfer_intent_id: string;
    }
  | { type: 'LINK_TOKEN_UPDATE_MODE_CREATED'; id: number; token: string }
  | { type: 'LINK_TOKEN_ERROR'; error: PlaidLinkError }
  | { type: 'DELETE_LINK_TOKEN'; id: number };

interface TransferContextShape extends TransferState {
  dispatch: Dispatch<TransferAction>;
  transferIds: TransferState;
  generateTransferIntentId: (
    userId: number,
    subscriptionAmount: number
  ) => string;
}
const TransferContext = createContext<TransferContextShape>(
  //@ts-ignore
  initialState as TransferContextShape
);

/**
 * @desc Maintains the Link context state and fetches link tokens to update that state.
 */
export function TransferProvider(props: any) {
  const [transferIds, dispatch] = useReducer(reducer, initialState);

  /**
   * @desc sets a new transferIntentId
   */

  const generateTransferIntentId = useCallback(
    async (userId, subscriptionAmount) => {
      const transferIntentResponse = await getTransferIntentId(
        userId,
        subscriptionAmount
      );
      const transfer_intent_id = transferIntentResponse.data.transfer_intent.id;
      dispatch({
        type: 'SET_TRANSFER_INTENT_ID',
        transfer_intent_id: transfer_intent_id,
      });
      return transfer_intent_id;
    },
    []
  );

  const value = useMemo(
    () => ({
      generateTransferIntentId,
      transferIds,
    }),
    [transferIds, generateTransferIntentId]
  );

  return <TransferContext.Provider value={value} {...props} />;
}

/**
 * @desc Handles updates to the TransferIntentId state as dictated by dispatched actions.
 */
function reducer(state: any, action: TransferAction) {
  switch (action.type) {
    case 'SET_TRANSFER_INTENT_ID':
      return {
        transfer_intent_id: action.transfer_intent_id,
      };
    default:
      console.warn('unknown action');
      return state;
  }
}

/**
 * @desc A convenience hook to provide access to the Transfer context state in components.
 */
export default function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error(`useTransfer must be used within a TransferProvider`);
  }

  return context;
}
