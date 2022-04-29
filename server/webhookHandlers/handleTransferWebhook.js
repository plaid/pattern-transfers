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
  updateAppAccountBalance,
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
  const serverLogAndEmitSocket = webhookCode => {
    console.log(
      `WEBHOOK: TRANSFERS: ${webhookCode}: transfer webhook received}`
    );
    // use websocket to notify the client that a webhook has been received and handled
    if (webhookCode) io.emit(webhookCode);
  };

  const callEventSync = async afterId => {
    const sycnRequest = {
      after_id: afterId,
      count: 25,
    };
    const syncResponse = await plaid.transferEventSync(sycnRequest);
    return syncResponse.data.transfer_events;
  };

  switch (webhookCode) {
    case 'TRANSFER_EVENTS_UPDATE': {
      const currentEventsInDB = await retrieveEvents();
      // if no events are saved in database ( you are in development mode), need to get latest event_id from app_status
      const appStatus = await retrieveAppStatus();
      const afterId =
        currentEventsInDB.length === 0
          ? appStatus[0].number_of_events
          : currentEventsInDB[currentEventsInDB.length - 1].plaid_event_id;

      const allNewPlaidEvents = await callEventSync(afterId);

      let newSweepAmountToAdd = 0;
      const newEventsAddedToDatabase = allNewPlaidEvents.map(async event => {
        const transfer = await retrieveTransferByPlaidTransferId(
          event.transfer_id
        );
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
          console.log(Number(event.sweep_amount));
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
      });

      await Promise.all(newEventsAddedToDatabase);
      const oldAccountBalance = appStatus[0].app_account_balance;
      const newAccountBalance = oldAccountBalance + newSweepAmountToAdd;
      console.log(oldAccountBalance, newSweepAmountToAdd, newAccountBalance);
      await updateAppAccountBalance(newAccountBalance);
      const newStatus = await retrieveAppStatus();
      console.log('new', newStatus);

      serverLogAndEmitSocket(webhookCode);
      break;
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
