/**
 * @file Defines the handler for Item webhooks.
 * https://plaid.com/docs/#item-webhooks
 */

const {
  updateItemStatus,
  retrieveItemByPlaidItemId,
} = require('../db/queries');

/**
 * Handles all Item webhook events.
 *
 * @param {Object} requestBody the request body of an incoming webhook event.
 * @param {Object} io a socket.io server instance.
 */
const itemsHandler = async (requestBody, io) => {
  const {
    webhook_code: webhookCode,
    item_id: plaidItemId,
    error,
  } = requestBody;

  const serverLogAndEmitSocket = (additionalInfo, itemId, errorCode) => {
    console.log(
      `WEBHOOK: ITEMS: ${webhookCode}: Plaid item id ${plaidItemId}: ${additionalInfo}`
    );
    // use websocket to notify the client that a webhook has been received and handled
    if (webhookCode) io.emit(webhookCode, { itemId, errorCode });
  };

  switch (webhookCode) {
    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      serverLogAndEmitSocket('is updated', plaidItemId, error);
      break;
    case 'ERROR': {
      itemErrorHandler(plaidItemId, error);
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      serverLogAndEmitSocket(
        `ERROR: ${error.error_code}: ${error.error_message}`,
        itemId,
        error.error_code
      );
      break;
    }
    case 'PENDING_EXPIRATION': {
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      await updateItemStatus(itemId, 'bad');
      serverLogAndEmitSocket(
        `user needs to re-enter login credentials`,
        itemId,
        error
      );
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

module.exports = itemsHandler;
