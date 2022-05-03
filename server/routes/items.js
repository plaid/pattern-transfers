/**
 * @file Defines all routes for the Items route.
 */

const express = require('express');
const Boom = require('@hapi/boom');
const {
  retrieveItemById,
  retrieveAccountsByItemId,
  createItem,
  createAccount,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const plaid = require('../plaid');
const { sanitizeAccounts, sanitizeItems } = require('../util');

const router = express.Router();

/**
 * First exchanges a public token for a private token via the Plaid API and
 * stores the newly created item in the DB.  Then fetches auth data or processor token and identity data from
 * the Plaid API and creates and stores newly created account in the DB.
 *
 * @param {string} publicToken public token returned from the onSuccess call back in Link.
 * @param {string} institutionId the Plaid institution ID of the new item.
 * @param {string} userId the Plaid user ID of the active user.
 * @param {object} accounts the accounts chosen by the user from the onSuccess metadata.
 */
router.post(
  '/',
  asyncWrapper(async (req, res) => {
    const { publicToken, institutionId, userId, accounts } = req.body;
    try {
      // exchange the public token for a private access token and store with the item.
      const response = await plaid.itemPublicTokenExchange({
        public_token: publicToken,
      });
      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;
      const newItem = await createItem(
        institutionId,
        accessToken,
        itemId,
        userId
      );

      // in case developer did not customize their Account Select in the dashboard to enable only one account,
      // choose the checking or savings account.
      const checkingAccount = accounts.filter(
        account => account.subtype === 'checking'
      );
      const savingsAccount = accounts.filter(
        account => account.subtype === 'savings'
      );
      const account =
        accounts.length === 1
          ? accounts[0]
          : checkingAccount.length > 0
          ? checkingAccount[0]
          : savingsAccount[0];

      const newAccount = await createAccount(itemId, userId, account);

      res.json({
        items: sanitizeItems(newItem),
        accounts: newAccount,
      });
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  })
);

/**
 * Retrieves a single item.
 *
 * @param {string} itemId the ID of the item.
 * @returns {Object[]} an array containing a single item.
 */
router.get(
  '/:itemId',
  asyncWrapper(async (req, res) => {
    try {
      const { itemId } = req.params;
      const item = await retrieveItemById(itemId);
      res.json(sanitizeItems(item));
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  })
);

/**
 * Retrieves all accounts associated with a single item.
 *
 * @param {string} itemId the ID of the item.
 * @returns {Object[]} an array of accounts.
 */
router.get(
  '/:itemId/accounts',
  asyncWrapper(async (req, res) => {
    try {
      const { itemId } = req.params;
      const accounts = await retrieveAccountsByItemId(itemId);
      res.json(sanitizeAccounts(accounts));
    } catch (err) {
      console.log(err);
      res.json(err);
    }
  })
);

module.exports = router;
