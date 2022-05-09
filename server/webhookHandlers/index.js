/**
 * @file Defines the handlers for various types of webhooks.
 */

const handleItemWebhook = require('./handleItemWebhook');
const handleTransferWebhook = require('./handleTransferWebhook');
const unhandledWebhook = require('./unhandledWebhook');

module.exports = {
  handleItemWebhook,
  handleTransferWebhook,
  unhandledWebhook,
};
