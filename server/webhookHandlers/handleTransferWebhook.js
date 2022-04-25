/**
 * @file Defines the handler for Item webhooks.
 * https://plaid.com/docs/#item-webhooks
 */

const { createEvent, retrieveEvents } = require('../db/queries');
const plaid = require('../plaid');

/**
 * Handles all Item webhook events.
 *
 * @param {Object} requestBody the request body of an incoming webhook event.
 * @param {Object} io a socket.io server instance.
 */
const transfersHandler = async (requestBody, io) => {
  const {
    webhook_code: webhookCode,
    item_id: plaidItemId,
    error,
  } = requestBody;

  const serverLogAndEmitSocket = webhookCode => {
    console.log(
      `WEBHOOK: TRANSFERS: ${webhookCode}: transfer webhook received}`
    );
    // use websocket to notify the client that a webhook has been received and handled
    if (webhookCode) io.emit(webhookCode);
  };

  switch (webhookCode) {
    case 'TRANSFER_EVENTS_UPDATE"': {
      const allEvents = await retrieveEvents();
      const sycnRequest = {
        after_id: allEvents[allEvents.length - 1].plaid_event_id,
        count: 25,
      };
      const syncResponse = await plaid.transferEventSync(sycnRequest);

      await syncResponse.data.transfer_events.forEach(async event => {
        const newEvent = await createEvent(
          event.event_id,
          transfer_response.user_id,
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
      });
      console.log('newEvent:', newEvent);
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
