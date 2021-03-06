/**
 * @file Exports the queries for interacting with the database.
 */

const {
  createAccount,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
} = require('./accounts');
const {
  createTransfer,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
  addTransferInfo,
  updateTransferStatus,
  retrieveTransferByPlaidTransferId,
  retrieveAllTransfers,
  deleteTransfersByUserId,
} = require('./transfers');
const { createEvent, retrieveEvents } = require('./transferEvents');
const {
  createInitialStatus,
  setNumberOfEvents,
  updateAppStatus,
  retrieveAppStatus,
} = require('./appStatus');
const {
  createItem,
  retrieveItemById,
  retrieveItemByPlaidAccessToken,
  retrieveItemByPlaidItemId,
  retrieveItemsByUser,
} = require('./items');
const { createPlaidApiEvent } = require('./plaidApiEvents');

const {
  createUser,
  deleteUsers,
  retrieveUsers,
  retrieveUserById,
  retrieveUserByUsername,
} = require('./users');

const {
  createPayments,
  addPayment,
  setMonthlyPayment,
  retrievePaymentsByUser,
} = require('./payments');

const { createLinkEvent } = require('./linkEvents');

module.exports = {
  // accounts
  createAccount,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
  // transfers
  createTransfer,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
  addTransferInfo,
  updateTransferStatus,
  retrieveTransferByPlaidTransferId,
  retrieveAllTransfers,
  deleteTransfersByUserId,
  // events
  createEvent,
  retrieveEvents,
  // appStatus
  createInitialStatus,
  setNumberOfEvents,
  updateAppStatus,
  retrieveAppStatus,
  // items
  createItem,
  retrieveItemById,
  retrieveItemByPlaidAccessToken,
  retrieveItemByPlaidItemId,
  retrieveItemsByUser,
  // plaid api events
  createPlaidApiEvent,
  // users
  createUser,
  deleteUsers,
  retrieveUserById,
  retrieveUserByUsername,
  retrieveUsers,
  // payments
  createPayments,
  addPayment,
  setMonthlyPayment,
  retrievePaymentsByUser,
  // link events
  createLinkEvent,
};
