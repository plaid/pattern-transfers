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

  const callEventList = async () => {
    const allTransfers = await retrieveAllTransfers();
    const allEvents = allTransfers.map(async transfer => {
      const date = new Date();
      const endDate = date.toISOString();
      const transferEventListRequest = {
        start_date: transfer.created_at,
        end_date: endDate,
        transfer_id: transfer.transfer_id,
        account_id: transfer.plaid_account_id,
        transfer_type: transfer.type,
        event_types: [
          'pending',
          'cancelled',
          'failed',
          'posted',
          'reversed',
          'swept',
          'reverse_swept',
        ],
        count: 25,
      };
      const transferEventListResponse = await plaid.transferEventList(
        transferEventListRequest
      );
      if (transferEventListResponse != null) {
        return transferEventListResponse.data.transfer_events;
      }
      return null;
    });
    const allEventsArray = await Promise.all(allEvents);
    return [].concat.apply([], allEventsArray);
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
      // if no events are saved in database, need to call transfer/event/list on all transfers instead of events/sync because you don't have an after_id for events/sync
      const allNewPlaidEvents =
        currentEventsInDB.length === 0
          ? await callEventList()
          : await callEventSync(
              currentEventsInDB[currentEventsInDB.length - 1].plaid_event_id
            );

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
