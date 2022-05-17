/**
 * @file Defines the handler for Transfers webhooks.
 * https://plaid.com/docs/transfer/webhooks/
 */

const {
  createEvent,
  retrieveEvents,
  retrieveTransferByPlaidTransferId,
  updateTransferStatus,
  retrieveAllTransfers,
  retrieveAppStatus,
  updateAppStatus,
} = require('../db/queries');
const plaid = require('../plaid');

/**
 * Handles all Transfers webhook events.
 *
 * @param {Object} requestBody the request body of an incoming webhook event.
 * @param {Object} io a socket.io server instance.
 */
const transfersHandler = async (requestBody, io) => {
  const { webhook_code: webhookCode } = requestBody;
  const serverLogAndEmitSocket = async (webhookCode, status) => {
    try {
      if (status === 'no events') {
        await io.emit('NO_NEW_EVENTS');
      } else {
        console.log(
          `WEBHOOK: TRANSFERS: ${webhookCode}: transfer webhook received}`
        );
        // use websocket to notify the client that a webhook has been received and handled
        if (webhookCode != null) {
          try {
            await io.emit(webhookCode);
          } catch (err) {
            console.log('error', err);
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  switch (webhookCode) {
    case 'TRANSFER_EVENTS_UPDATE': {
      try {
        const appStatus = await retrieveAppStatus();
        let afterId = appStatus[0].number_of_events;
        let hasEventsToFetch = true;
        const batchSize = 2; // 25 is the maximum number of events returned
        let allNewPlaidEvents;
        while (hasEventsToFetch) {
          const sycnRequest = {
            after_id: afterId,
            count: batchSize,
          };
          const syncResponse = await plaid.transferEventSync(sycnRequest);
          allNewPlaidEvents = allNewPlaidEvents.concat(
            syncResponse.data.transfer_events
          );
          if (allNewPlaidEvents.length === batchSize) {
            afterId += allNewPlaidEvents.length;
          } else {
            hasEventsToFetch = false;
          }
        }
        if (allNewPlaidEvents.length === 0) {
          console.log('no new events');
          await serverLogAndEmitSocket(webhookCode, 'no events');
          break;
        }
        // to update app's business checking account balance, track sweep amount totals from new events
        let newSweepAmountToAdd = 0;

        const newEventsAddedToDatabase = allNewPlaidEvents.map(async event => {
          const transfer = await retrieveTransferByPlaidTransferId(
            event.transfer_id
          );
          if (transfer != null) {
            const newEvent = await createEvent(
              event.event_id,
              transfer.user_id,
              event.account_id,
              event.transfer_id,
              event.transfer_type,
              event.event_type,
              event.transfer_amount,
              event.sweep_amount,
              event.sweep_id,
              event.failure_reason,
              event.timepstamp
            );

            if (event.sweep_amount != null) {
              newSweepAmountToAdd += Number(event.sweep_amount);
            }

            const transferGetResponse = await plaid.transferGet({
              transfer_id: newEvent.transfer_id,
            });

            await updateTransferStatus(
              transferGetResponse.data.transfer.status,
              transferGetResponse.data.transfer.sweep_status,
              newEvent.transfer_id
            );
            return newEvent;
          }
        });

        await Promise.all(newEventsAddedToDatabase);

        const oldAccountBalance = appStatus[0].app_account_balance;
        const newAccountBalance = oldAccountBalance + newSweepAmountToAdd;
        const newNumberOfEvents = (appStatus[0].number_of_events +=
          allNewPlaidEvents.length);
        await updateAppStatus(newAccountBalance, newNumberOfEvents);

        const newStatus = await retrieveAppStatus();

        await serverLogAndEmitSocket(webhookCode, null);

        break;
      } catch (err) {
        console.log(err);
      }
    }
    default:
      serverLogAndEmitSocket(
        'unhandled webhook type received.',
        plaidItemId,
        error
      );
  }
};

module.exports = transfersHandler;
