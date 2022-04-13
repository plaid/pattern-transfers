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
  createTransferWithTransferUI,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
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
  updateIdentityCheck,
  updateUserInfo,
} = require('./users');

const {
  createAppFund,
  updateAppFundsBalance,
  retrieveAppFundsByUser,
} = require('./appFunds');
const { createLinkEvent } = require('./linkEvents');

module.exports = {
  // accounts
  createAccount,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
  // transfers
  createTransferWithTransferUI,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
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
  updateIdentityCheck,
  updateUserInfo,
  // app funds
  createAppFund,
  updateAppFundsBalance,
  retrieveAppFundsByUser,
  // link events
  createLinkEvent,
};
