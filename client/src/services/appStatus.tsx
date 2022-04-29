import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  Dispatch,
} from 'react';

import { getAppStatus as apiGetAppStatus } from './api';

import { AppStatusType } from '../components/types';

interface AppStatusState {
  [statusId: number]: AppStatusType;
}

const initialState: AppStatusState = {};

type AppStatusAction = {
  type: 'SUCCESSFUL_GET';
  payload: AppStatusType;
};

interface AppStatusContextShape extends AppStatusState {
  dispatch: Dispatch<AppStatusAction>;
  getAppStatus: () => void;
}
const AppStatusContext = createContext<AppStatusContextShape>(
  initialState as AppStatusContextShape
);

/**
 * @desc Maintains the AppStatus context state and provides functions to update that state.
 */
export function AppStatusProvider(props: any) {
  const [appStatus, dispatch] = useReducer(reducer, initialState);

  /**
   * @desc Retrieves app status
   */
  const getAppStatus = useCallback(async () => {
    const { data: payload } = await apiGetAppStatus();
    const appStatus = payload[0];
    dispatch({ type: 'SUCCESSFUL_GET', payload: appStatus });
  }, []);

  /**
   * @desc Builds a more accessible state shape from the Institution data. useMemo will prevent
   * these from being rebuilt on every render unless institutionsById is updated in the reducer.
   */
  const value = useMemo(() => {
    return {
      appStatus,
      getAppStatus,
    };
  }, [getAppStatus, appStatus]);

  return <AppStatusContext.Provider value={value} {...props} />;
}

/**
 * @desc Handles updates to the App Status state as dictated by dispatched actions.
 */
function reducer(state: AppStatusState, action: AppStatusAction) {
  switch (action.type) {
    case 'SUCCESSFUL_GET':
      if (!action.payload) {
        return state;
      }

      return {
        [action.payload.id]: action.payload,
      };
    default:
      console.warn('unknown action');
      return state;
  }
}

/**
 * @desc A convenience hook to provide access to the App Status context state in components.
 */
export default function useAppStatus() {
  const context = useContext(AppStatusContext);

  if (!context) {
    throw new Error(`useAppStatus must be used within an AppStatusProvider`);
  }

  return context;
}
