/**
 * @file Defines all routes for the App Funds route.
 */

const express = require('express');
const axios = require('axios');
const {
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
  createTransferWithTransferUI,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');

const router = express.Router();

const { PLAID_CLIENT_ID, PLAID_SECRET_SANDBOX } = process.env;

router.post(
  '/',
  asyncWrapper(async (req, res) => {
    try {
      const { userId, subscriptionAmount } = req.body;
      const transIntentCreateRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        mode: 'PAYMENT',
        amount: subscriptionAmount.toFixed(2),
        ach_class: 'ppd',
        description: 'foobar',
        user: {
          legal_name: 'Linda Woo',
        },
      };
      let transferIntentId;

      const transferIntentResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/intent/create`,
        transIntentCreateRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      transferIntentId = transferIntentResponse.data.transfer_intent.id;
      console.log(
        'transferIntentResponse!!!!!!!!!!!!!!!!!!!',
        transferIntentResponse
      );
      createTransferWithTransferUI(
        userId,
        transferIntentId,
        subscriptionAmount.toFixed(2)
      );
      res.json(transferIntentResponse.data);
    } catch (err) {
      console.log('error while fetching client token', err.response.data);
      return res.json(err.response.data);
    }
  })
);

/**
 * Retrieves transfers for a single user
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of transfers
 */
router.get(
  '/:userId',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const transfers = await retrieveTransfersByUserId(userId);
    res.json(transfers);
  })
);

/**
 * Retrieves transfers for a single item
 *
 * @param {string} itemId the ID of the item.
 * @returns {Object[]} an array of transfers
 */
router.get(
  '/:itemId',
  asyncWrapper(async (req, res) => {
    const { itemId } = req.params;
    const transfers = await retrieveTransfersByItemId(utemId);
    res.json(transfers);
  })
);

/**
 * Updates the appFund balance and increases the number of transfers count by 1
 *
 * @param {string} accountId the ID of the account.
 *  @param {number} userId the ID of the user.
 *  @param {number} transferAmount the amount being transferred.
 * @return {Object{}} the new appFund and new account objects.
 */
router.put(
  '/:userId/bank_transfer',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { transferAmount, accountId } = req.body;
    const appFunds = await retrieveAppFundsByUser(userId);
    const oldBalance = appFunds.balance;
    const newBalance = oldBalance + transferAmount;
    await updateAppFundsBalance(userId, newBalance);
    // increment the number of transfers by 1
    const newAppFunds = await retrieveAppFundsByUser(userId);
    const account = await retrieveAccountByPlaidAccountId(accountId);
    const oldNumber = account.number_of_transfers;
    const newNumber = oldNumber + 1;
    await updateTransfers(accountId, newNumber);
    const newAccount = await retrieveAccountByPlaidAccountId(accountId);
    const response = {
      newAccount,
      newAppFunds: newAppFunds,
    };
    res.json(response);
  })
);

module.exports = router;
