/**
 * @file Defines all routes for the transfers route.
 */

const express = require('express');
const axios = require('axios');
const {
  createTransfer,
  addTransferInfo,
  retrieveUserById,
  retrieveItemById,
  retrieveAccountsByUserId,
  retrieveTransfersByUserId,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');

const router = express.Router();

const { PLAID_CLIENT_ID, PLAID_SECRET_SANDBOX } = process.env;

/**
 * creates a transfer intent for Transfer UI and retrieves a transfer_intent_id
 *
 * @param {string} subscriptionAmount the amount of the transfer.
 * @returns {Object}  transfer intent response
 */

router.post(
  '/transfer_ui',
  asyncWrapper(async (req, res) => {
    try {
      const { userId, subscriptionAmount } = req.body;
      const { username: username } = await retrieveUserById(userId);
      const transIntentCreateRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        mode: 'PAYMENT',
        amount: subscriptionAmount.toFixed(2),
        ach_class: 'ppd',
        description: 'foobar',
        user: {
          legal_name: username,
        },
      };
      let transferIntentId;

      const transferIntentCreateResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/intent/create`,
        transIntentCreateRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      transferIntentId = transferIntentCreateResponse.data.transfer_intent.id;

      createTransfer(
        null, //item_id
        userId,
        null, // plaid_account_id
        transferIntentId,
        null, // authorization_id - for TransferUI transfers
        null, // transfer_id
        subscriptionAmount.toFixed(2),
        null, // status
        null // sweep_status
      );
      res.json(transferIntentCreateResponse.data);
    } catch (err) {
      console.log('error while creating transfer intent id', err.response.data);
      return res.json(err.response.data);
    }
  })
);

/**
 * creates a transfer authorization for Transfer and retrieves an authorization_id
 *
 * @param {string} subscriptionAmount the amount of the transfer.
 * @returns {Object}  transfer intent response
 */

router.post(
  '/transfer',
  asyncWrapper(async (req, res) => {
    try {
      const { userId, itemId, subscriptionAmount } = req.body;
      const { username: username } = await retrieveUserById(userId);
      const { plaid_access_token: accessToken } = await retrieveItemById(
        itemId
      );
      const accounts = await retrieveAccountsByUserId(userId);
      const accountId = accounts[0]['plaid_account_id'];

      const transferAuthorizationCreateRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        access_token: accessToken,
        account_id: accountId,
        type: 'debit',
        network: 'ach',
        amount: subscriptionAmount.toFixed(2),
        ach_class: 'ppd',
        user: {
          legal_name: username,
        },
      };
      const transferAuthorizationCreateResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/authorization/create`,
        transferAuthorizationCreateRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const authorizationId =
        transferAuthorizationCreateResponse.data.authorization.id;

      const transferCreateRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        authorization_id: authorizationId,
        access_token: accessToken,
        account_id: accountId,
        type: 'debit',
        network: 'ach',
        amount: subscriptionAmount.toFixed(2),
        description: 'monthlyPMT',
        ach_class: 'ppd',
        user: {
          legal_name: username,
        },
      };

      const transferCreateResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/create`,
        transferCreateRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );
      console.log('create response', transferAuthorizationCreateResponse.data);
      const {
        id,
        account_id,
        amount,
        status,
      } = transferCreateResponse.data.transfer;

      await createTransfer(
        itemId,
        userId,
        account_id,
        null, // intent_id is null for non TransferUI transfers
        authorizationId,
        id, // transfer_id
        Number(amount).toFixed(2),
        status,
        null // sweep_status
      );

      const transfers = await retrieveTransfersByUserId(userId);
      const response = { transfers };
      res.json(response);
    } catch (err) {
      console.log('error while creating transfer', err.response.data);
      return res.json(err.response.data);
    }
  })
);

/**
 * gets the status of the transfer_ui intent and obtains the transfer_id from the TransferUI process.
 *
 * @param {string} intentId the transfer intent id of the transfer.
 * @returns {Object} status response
 */

router.post(
  '/transfer_ui/status',
  asyncWrapper(async (req, res) => {
    try {
      const { intentId } = req.body;
      const transIntentGetRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        transfer_intent_id: intentId,
      };

      const transferIntentGetResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/intent/get`,
        transIntentGetRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      res.json(transferIntentGetResponse.data);
    } catch (err) {
      console.log('error while getting status', err.response.data);
      return res.json(err.response.data);
    }
  })
);

/**
 * gets the status of a particular transfer
 *
 * @param {string} transferId the transfer id of the transfer.
 * @returns {Object} status response
 */

router.post(
  '/transfer/status',
  asyncWrapper(async (req, res) => {
    try {
      const { transferId } = req.body;
      const transferGetRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        transfer_id: transferId,
      };

      const transferGetResponse = await axios.post(
        `https://sandbox.plaid.com/transfer/get`,
        transferGetRequest,
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      res.json(transferGetResponse.data);
    } catch (err) {
      console.log('error while getting status', err.response.data);
      return res.json(err.response.data);
    }
  })
);

/**
 * adds information to a transfer after getting status (because the inital creation of the transfer
 * with TransferUI does not provide this information)
 *
 * @param {string} transferIntentId the transfer_intent_id of the transfer.
 * @param {string} destinationId the destination account id for the transfer.
 * @param {string} transferId the transfer id of the transfer.
 * @param {string} originationId the origination account id for the transfer.
 * @param {string} status the status of the transfer.
 * @param {string} sweepStatus the sweep status of the transfer.
 * @param {string} itemId the item id associated with the transfer.
 * @returns {Object[]} an array of transfers
 */

router.put(
  '/:transferIntentId/add_info',
  asyncWrapper(async (req, res) => {
    try {
      const { transferIntentId } = req.params;
      const { accountId, transferId, status, sweepStatus, itemId } = req.body;
      const transfer = await addTransferInfo(
        status,
        transferId,
        accountId,
        sweepStatus,
        itemId,
        transferIntentId
      );
      res.json(transfer);
    } catch (err) {
      console.log('error while adding info', err.response.data);
      return res.json(err.response.data);
    }
  })
);

module.exports = router;
