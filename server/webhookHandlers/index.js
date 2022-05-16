/**
 * @file Defines the handlers for various types of webhooks.
 */

const handleTransferWebhook = require('./handleTransferWebhook');
const unhandledWebhook = require('./unhandledWebhook');

module.exports = {
  handleTransferWebhook,
  unhandledWebhook,
};
