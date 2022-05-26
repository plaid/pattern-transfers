import React, { useEffect } from 'react';
import {
  usePlaidLink,
  PlaidLinkOnSuccessMetadata,
  PlaidLinkOnExitMetadata,
  PlaidLinkError,
  PlaidLinkOptionsWithLinkToken,
  PlaidLinkOnEventMetadata,
  PlaidLinkStableEvent,
} from 'react-plaid-link';
import { useHistory } from 'react-router-dom';

import { logEvent, logSuccess, logExit } from '../util'; // functions to log and save errors and metadata from Link events.
import {
  exchangeToken,
  getTransferUIStatus,
  getTransferStatus,
  addTransferInfo,
  getTransfersByUserId as apiGetTransfersByUserId,
  addPayment,
  getPaymentsByUser,
} from '../services/api';
import { useItems, useLink, useErrors, useTransfers } from '../services';
import { PaymentType } from './types';
interface Props {
  isOauth?: boolean;
  token: string;
  userId: number;
  itemId?: number | null;
  children?: React.ReactNode;
  setPayments?: (payment: PaymentType) => void;
}

// Uses the usePlaidLink hook to manage the Plaid Link creation.  See https://github.com/plaid/react-plaid-link for full usage instructions.
// In this sample app, the link token is generated in the link context in client/src/services/link.js.
const LinkButton: React.FC<Props> = (props: Props) => {
  const history = useHistory();
  const { getItemsByUser } = useItems();
  const { generateLinkTokenForTransfer } = useLink();
  const { getTransfersByUser, deleteTransfersByUserId } = useTransfers();
  const { setError, resetError } = useErrors();

  const updateInitalTransfer = async (itemId: number) => {
    try {
      // need to get transfer_intent_id directly from database because context
      // is wiped out with Oauth
      const transferResponse = await apiGetTransfersByUserId(props.userId);
      // use transfer_intent_id to obtain transfer_id from transferUI status
      const transferUIDataResponse = await getTransferUIStatus(
        transferResponse.data[0].transfer_intent_id
      );
      // use transfer_id to obtain information about the transfer and add info to existing transfer in database
      const transferDataResponse = await getTransferStatus(
        transferUIDataResponse.data.transfer_intent.transfer_id,
        true
      );

      const { account_id, id, status, sweep_status, amount, type } =
        transferDataResponse.data.transfer;
      // update database with information regarding the transfer
      await addTransferInfo(
        transferResponse.data[0].transfer_intent_id,
        account_id,
        id,
        status,
        sweep_status,
        itemId,
        type
      );

      // update the user's payment data
      const response = await addPayment(props.userId, Number(amount));
      // set payments state on user page to re-render with updated payment information
      if (props.setPayments != null) {
        props.setPayments(response.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // define onSuccess, onExit and onEvent functions as configs for Plaid Link creation
  const onSuccess = async (
    publicToken: string,
    metadata: PlaidLinkOnSuccessMetadata
  ) => {
    // log and save metatdata
    logSuccess(metadata, props.userId);
    if (
      metadata.transfer_status != null &&
      metadata.transfer_status === 'INCOMPLETE'
    ) {
      await deleteTransfersByUserId(props.userId);
    } else {
      // call to Plaid api endpoint: /item/public_token/exchange in order to obtain access_token which is then stored with the created item
      try {
        const data = await exchangeToken(
          publicToken,
          metadata.institution,
          metadata.accounts,
          props.userId
        );
        getItemsByUser(props.userId, true);

        await updateInitalTransfer(data.items[0].id);
        await getTransfersByUser(props.userId);
        await getPaymentsByUser(props.userId);
      } catch (e) {
        if (e instanceof Error) {
          console.error('error', e.message);
        }
      }
    }
    resetError();
    history.push(`/user/${props.userId}`);
  };

  const onExit = async (
    error: PlaidLinkError | null,
    metadata: PlaidLinkOnExitMetadata
  ) => {
    try {
      // log and save error and metatdata
      logExit(error, metadata, props.userId);
      // delete the incompleted transfer om the database that was created when transfer_intent request was made
      await deleteTransfersByUserId(props.userId);
      if (error != null) {
        if (error.error_code === 'INVALID_LINK_TOKEN') {
          const transferResponse = await apiGetTransfersByUserId(props.userId);
          await generateLinkTokenForTransfer(
            props.userId,
            transferResponse.data[0].transfer_intent_id
          );
        } else {
          setError(
            error.error_code,
            error.display_message || error.error_message
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
    // to handle other error codes, see https://plaid.com/docs/errors/
  };

  const onEvent = async (
    eventName: PlaidLinkStableEvent | string,
    metadata: PlaidLinkOnEventMetadata
  ) => {
    // handle errors in the event end-user does not exit with onExit function error enabled.
    if (eventName === 'ERROR' && metadata.error_code != null) {
      setError(metadata.error_code, ' ');
    }
    logEvent(eventName, metadata);
  };

  const config: PlaidLinkOptionsWithLinkToken = {
    //@ts-ignore  (will fix this later)
    onSuccess,
    onExit,
    onEvent,
    token: props.token,
  };

  if (props.isOauth) {
    config.receivedRedirectUri = window.location.href; // add additional receivedRedirectUri config when handling an OAuth reidrect
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    // initiallizes Link automatically
    if (props.isOauth && ready) {
      open();
    } else if (ready) {
      localStorage.setItem(
        'oauthConfig',
        JSON.stringify({
          userId: props.userId,
          itemId: props.itemId,
          token: props.token,
        })
      );
      open();
    }
  }, [ready, open, props.isOauth, props.userId, props.itemId, props.token]);

  return <></>;
};

LinkButton.displayName = 'LinkButton';
export default LinkButton;
