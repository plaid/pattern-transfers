/**
 * @file Defines all routes for the transfers route.
 */

const express = require('express');
const {
  createTransfer,
  addTransferInfo,
  retrieveUserById,
  retrieveItemById,
  retrieveAccountsByUserId,
  retrieveTransfersByUserId,
  updateTransferStatus,
  retrieveTransferByPlaidTransferId,
  deleteTransfersByUserId,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const plaid = require('../plaid');

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
        description: 'initial monthly payment',
        user: {
          legal_name: username,
        },
      };
      let transferIntentId;

      const transferIntentCreateResponse = await plaid.transferIntentCreate(
        transIntentCreateRequest
      );
      transferIntentId = transferIntentCreateResponse.data.transfer_intent.id;
      // create new Transfer now so that you can reference its transferIntentId upon link success
      // because the link success metadata does not pass back any data about the transfer except for transfer_status
      const newTransfer = await createTransfer(
        null, // item_id
        userId,
        null, // plaid_account_id
        transferIntentId,
        null, // authorization_id - for TransferUI transfers
        null, // transfer_id
        subscriptionAmount.toFixed(2),
        null, // status
        'debit',
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
 * creates a transfer authorization for Transfer, retrieves an authorization_id to use to
 * create a transfer.
 *
 * @param {string} subscriptionAmount the amount of the transfer.
 * @param {number} userId the user id of the user.
 * @param {number} itemId the item id of the item.
 * @returns {Object}  transfers by user.
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

      const transferAuthorizationCreateResponse = await plaid.transferAuthorizationCreate(
        transferAuthorizationCreateRequest
      );
      if (
        transferAuthorizationCreateResponse.data.authorization.decision !==
        'approved'
      ) {
        return res.status(400).json({
          message:
            transferAuthorizationCreateResponse.data.authorization
              .decision_rationale.description,
        });
      }

      const authorizationId =
        transferAuthorizationCreateResponse.data.authorization.id;

      const transferCreateRequest = {
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

      const transferCreateResponse = await plaid.transferCreate(
        transferCreateRequest
      );

      const {
        id,
        account_id,
        amount,
        status,
        type,
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
        'debit',
        'unswept'
      );

      const transfers = await retrieveTransfersByUserId(userId);
      return res.json(transfers);
    } catch (err) {
      console.log('error while creating transfer', err.response.data);
      if (err.response.data.error_type === 'RATE_LIMIT_EXCEEDED') {
        return res.status(400).json({
          message:
            'You have exceeded the transfer-create rate limit for this item. Try again later',
        });
      }
      return res.json(err.response.data);
    }
  })
);

/**
 * gets the status of the transfer_ui intent and obtains the transfer_id in order to get status of transfer.
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

      const transferIntentGetResponse = await plaid.transferIntentGet(
        transIntentGetRequest
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
      const { transferId, isTransferUI } = req.body;
      const transferGetRequest = {
        transfer_id: transferId,
      };

      const transferGetResponse = await plaid.transferGet(transferGetRequest);
      if (isTransferUI) {
        return res.json(transferGetResponse.data);
      }
      await updateTransferStatus(
        transferGetResponse.data.transfer.status,
        transferGetResponse.data.transfer.sweep_status,
        transferId
      );

      const updatedTransfer = await retrieveTransferByPlaidTransferId(
        transferId
      );
      res.json(updatedTransfer);
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
      const {
        accountId,
        transferId,
        status,
        sweepStatus,
        itemId,
        type,
      } = req.body;

      const transfer = await addTransferInfo(
        status,
        transferId,
        accountId,
        sweepStatus,
        itemId,
        type,
        transferIntentId
      );

      res.json(transfer);
    } catch (err) {
      console.log('error while adding info', err.response.data);
      return res.json(err.response.data);
    }
  })
);

router.post(
  '/simulate_sweep',
  asyncWrapper(async (req, res) => {
    try {
      const sweepRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
      };
      const sweepResponse = await plaid.sandboxTransferSweepSimulate(
        sweepRequest
      );
      res.json(sweepResponse.data);
    } catch (err) {
      console.log('error while sweeping', err.response.data);
      return res.json(err.response.data);
    }
  })
);

router.post(
  '/simulate_event',
  asyncWrapper(async (req, res) => {
    try {
      const { transferId, event } = req.body;
      const transferSimulateRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        transfer_id: transferId,
        event_type: event,
      };
      const transferSimulateResponse = await plaid.sandboxTransferSimulate(
        transferSimulateRequest
      );
      res.json(transferSimulateResponse.data);
    } catch (err) {
      console.log('error while simulating event', err.response.data);
      // handle if user tries to simulate an event that does not jibe with current transfer status.
      // for example if status is posted and user clicks on "fail"

      return res.status(400).json({ message: err.response.data.error_message });
    }
  })
);

/**
 * Deletes transfers by user
 *
 * @param {string} userId the ID of the user.
 */
router.delete(
  '/:userId',
  asyncWrapper(async (req, res) => {
    try {
      const { userId } = req.params;
      await deleteTransfersByUserId(userId);
      const transfers = await retrieveAccountsByUserId(userId);
      return res.json(transfers);
    } catch (err) {
      console.lot(err);
    }
  })
);

module.exports = router;
