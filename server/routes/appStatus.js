/**
 * @file Defines all routes for the App Status route.
 */

const express = require('express');
const { createInitialStatus, retrieveAppStatus } = require('../db/queries');
const { asyncWrapper, errorHandler } = require('../middleware');
const plaid = require('../plaid');

const router = express.Router();
const { PLAID_CLIENT_ID, PLAID_SECRET_SANDBOX } = process.env;

/**
 * Sets up initial app status if it doesn't already exist.
 *
 * @returns {Object[]} an array of app funds
 */
router.get(
  '/initial',
  asyncWrapper(async (req, res) => {
    try {
      const status = await retrieveAppStatus();

      if (status.length === 0) {
        // get the last event_id
        const transferEventListRequest = {
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET_SANDBOX,
        };
        const response = await plaid.transferEventList(
          transferEventListRequest
        );

        console.log(response.data);

        await createInitialStatus(response.data.transfer_events[0].event_id);
      }

      res.json(status);
    } catch (err) {
      errorHandler(err);
    }
  })
);

router.get(
  '/status',
  asyncWrapper(async (req, res) => {
    try {
      const status = await retrieveAppStatus();
      res.json(status);
    } catch (err) {
      errorHandler(err);
    }
  })
);

module.exports = router;
