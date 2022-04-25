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
} = require('./transfers');
const {
  createItem,
  deleteItem,
  retrieveItemById,
  retrieveItemByPlaidAccessToken,
  retrieveItemByPlaidInstitutionId,
  retrieveItemByPlaidItemId,
  retrieveItemsByUser,
  updateItemStatus,
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
  // items
  createItem,
  deleteItem,
  retrieveItemById,
  retrieveItemByPlaidAccessToken,
  retrieveItemByPlaidInstitutionId,
  retrieveItemByPlaidItemId,
  retrieveItemsByUser,
  updateItemStatus,
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
