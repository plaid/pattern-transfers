import {
  PlaidLinkOnSuccessMetadata,
  PlaidLinkOnExitMetadata,
  PlaidLinkStableEvent,
  PlaidLinkOnEventMetadata,
  PlaidLinkError,
} from 'react-plaid-link';

import {
  postLinkEvent as apiPostLinkEvent,
  getTransferUIStatus,
  getTransferStatus,
  addTransferInfo,
} from '../services/api';
import { TransferSuccessMetadata } from '../components/types';

/**
 * @desc converts number values into $ currency strings
 */
export function currencyFilter(value: number | undefined) {
  if (typeof value !== 'number') {
    return '-';
  }

  const isNegative = value < 0;
  const displayValue = value < 0 ? -value : value;
  return `${isNegative ? '-' : ''}$${displayValue
    .toFixed(2)
    .replace(/(\d)(?=(\d{3})+(\.|$))/g, '$1,')}`;
}

export const logEvent = (
  eventName: PlaidLinkStableEvent | string,
  metadata:
    | PlaidLinkOnEventMetadata
    | PlaidLinkOnSuccessMetadata
    | PlaidLinkOnExitMetadata
    | TransferSuccessMetadata,
  error?: PlaidLinkError | null
) => {
  console.log(`Link Event: ${eventName}`, metadata, error);
};

export const logSuccess = async (
  {
    institution,
    accounts,
    link_session_id,
    transfer_status,
  }: TransferSuccessMetadata,
  userId: number
) => {
  logEvent('onSuccess', {
    institution,
    accounts,
    link_session_id,
    transfer_status,
  });
  await apiPostLinkEvent({
    userId,
    link_session_id,
    type: 'success',
  });
};

export const logExit = async (
  error: PlaidLinkError | null,
  { institution, status, link_session_id, request_id }: PlaidLinkOnExitMetadata,
  userId: number
) => {
  logEvent(
    'onExit',
    {
      institution,
      status,
      link_session_id,
      request_id,
    },
    error
  );

  const eventError = error || {};
  await apiPostLinkEvent({
    userId,
    link_session_id,
    request_id,
    type: 'exit',
    ...eventError,
    status,
  });
};

export const updateInitialTransfer = async (
  transferIntentId: string,
  itemId: number
) => {
  console.log('helloe', transferIntentId);
  const transferUIDataResponse = await getTransferUIStatus(transferIntentId);
  // console.log(
  //   'id response',
  //   transferUIDataResponse.data.transfer_intent.transfer_id
  // );
  const transferDataResponse = await getTransferStatus(
    transferUIDataResponse.data.transfer_intent.transfer_id,
    true
  );
  // console.log('status', transferDataResponse);
  const { account_id, id, status, sweep_status, amount } =
    transferDataResponse.data.transfer;
  // update database with information regarding the transfer
  const addInfoResponse = await addTransferInfo(
    transferIntentId,
    account_id,
    id,
    status,
    sweep_status,
    itemId,
    'some type'
  );
  console.log('add info response', addInfoResponse);
  return amount;
};
