import React, {
  useCallback,
  useContext,
  useMemo,
  useReducer,
  Dispatch,
  createContext,
} from 'react';

import { getLinkTokenForTransfer } from './api';

import { PlaidLinkError } from 'react-plaid-link';

interface LinkToken {
  [key: string]: string;
}

interface LinkState {
  byUser: LinkToken;
  byItem: LinkToken;
  error: PlaidLinkError;
}

const initialState = {
  byUser: {}, // normal case
  byItem: {}, // update mode
  error: {},
};
type LinkAction =
  | {
      type: 'LINK_TOKEN_CREATED';
      id: number;
      token: string;
    }
  | { type: 'LINK_TOKEN_UPDATE_MODE_CREATED'; id: number; token: string }
  | { type: 'LINK_TOKEN_ERROR'; error: PlaidLinkError }
  | { type: 'DELETE_LINK_TOKEN'; id: number };

interface LinkContextShape extends LinkState {
  dispatch: Dispatch<LinkAction>;
  generateLinkTokenForTransfer: (
    userId: number,
    subscriptionAmount: number
  ) => string;
  deleteLinkToken: (userId: number) => void;
  linkTokens: LinkState;
}
const LinkContext = createContext<LinkContextShape>(
  initialState as LinkContextShape
);

/**
 * @desc Maintains the Link context state and fetches link tokens to update that state.
 */
export function LinkProvider(props: any) {
  const [linkTokens, dispatch] = useReducer(reducer, initialState);

  /**
   * @desc Creates a new link token for a given User or Item.
   */

  const generateLinkTokenForTransfer = useCallback(
    async (userId, subscriptionAmount) => {
      const linkTokenResponse = await getLinkTokenForTransfer(
        userId,
        subscriptionAmount
      );
      if (linkTokenResponse.data.link_token) {
        const token = await linkTokenResponse.data.link_token;
        console.log('success', linkTokenResponse.data);
        dispatch({ type: 'LINK_TOKEN_CREATED', id: userId, token: token });
        return token;
      } else {
        dispatch({ type: 'LINK_TOKEN_ERROR', error: linkTokenResponse.data });
        console.log('error', linkTokenResponse.data);
      }
    },
    []
  );

  const deleteLinkToken = useCallback(async userId => {
    dispatch({
      type: 'DELETE_LINK_TOKEN',
      id: userId,
    });
  }, []);

  const value = useMemo(
    () => ({
      generateLinkTokenForTransfer,
      deleteLinkToken,
      linkTokens,
    }),
    [linkTokens, generateLinkTokenForTransfer, deleteLinkToken]
  );

  return <LinkContext.Provider value={value} {...props} />;
}

/**
 * @desc Handles updates to the LinkTokens state as dictated by dispatched actions.
 */
function reducer(state: any, action: LinkAction) {
  switch (action.type) {
    case 'LINK_TOKEN_CREATED':
      return {
        ...state,
        byUser: {
          [action.id]: action.token,
        },
        error: {},
      };

    case 'LINK_TOKEN_UPDATE_MODE_CREATED':
      return {
        ...state,
        error: {},
        byItem: {
          ...state.byItem,
          [action.id]: action.token,
        },
      };
    case 'DELETE_LINK_TOKEN':
      return {
        ...state,
        byUser: {
          [action.id]: '',
        },
      };
    case 'LINK_TOKEN_ERROR':
      return {
        ...state,
        error: action.error,
      };
    default:
      console.warn('unknown action');
      return state;
  }
}

/**
 * @desc A convenience hook to provide access to the Link context state in components.
 */
export default function useLink() {
  const context = useContext(LinkContext);
  if (!context) {
    throw new Error(`useLink must be used within a LinkProvider`);
  }

  return context;
}
