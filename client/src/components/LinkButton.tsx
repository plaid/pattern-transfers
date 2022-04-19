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
  setItemState,
  getTransferUIStatus,
  getTransferStatus,
  addTransferInfo,
  addPayment,
  getPaymentsByUser,
} from '../services/api';
import { useItems, useLink, useErrors, useTransfers } from '../services';
import { TransferSuccessMetadata } from './types';
interface Props {
  isOauth?: boolean;
  token: string;
  userId: number;
  itemId?: number | null;
  children?: React.ReactNode;
}

// Uses the usePlaidLink hook to manage the Plaid Link creation.  See https://github.com/plaid/react-plaid-link for full usage instructions.
// The link token passed to usePlaidLink cannot be null.  It must be generated outside of this component.  In this sample app, the link token
// is generated in the link context in client/src/services/link.js.
const LinkButton: React.FC<Props> = (props: Props) => {
  const history = useHistory();
  const { getItemsByUser, getItemById } = useItems();
  const { generateLinkToken } = useLink();
  const { transfersData, getTransfersByUser } = useTransfers();
  const { setError, resetError } = useErrors();

  // define onSuccess, onExit and onEvent functions as configs for Plaid Link creation
  const onSuccess = async (
    publicToken: string,
    metadata: TransferSuccessMetadata
  ) => {
    // log and save metatdata
    logSuccess(metadata, props.userId);
    if (props.itemId != null) {
      // update mode: no need to exchange public token
      await setItemState(props.itemId, 'good');
      getItemById(props.itemId, true);

      // regular link mode: exchange public token for access token
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

        // use transfer_intent_id to obtain transfer_id from transferUI status
        if (transfersData.transfer_intent_id != null) {
          const transferUIDataResponse = await getTransferUIStatus(
            transfersData.transfer_intent_id
          );

          // use transfer_id to obtain information about the transfer and add info to existing transfer in database
          const transferDataResponse = await getTransferStatus(
            transferUIDataResponse.data.transfer_intent.transfer_id
          );
          const {
            account_id,
            id,
            origination_account_id,
            status,
            sweep_status,
            amount,
          } = transferDataResponse.data.transfer;
          // update database with information regarding the transfer
          await addTransferInfo(
            transfersData.transfer_intent_id,
            account_id,
            id,
            origination_account_id,
            status,
            sweep_status,
            data.items[0].id
          );
          await addPayment(props.userId, Number(amount));
        }

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
    // log and save error and metatdata
    logExit(error, metadata, props.userId);
    if (error != null) {
      if (error.error_code === 'INVALID_LINK_TOKEN') {
        await generateLinkToken(props.userId, props.itemId, ''); // will fix later
      } else {
        setError(
          error.error_code,
          error.display_message || error.error_message
        );
      }
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
