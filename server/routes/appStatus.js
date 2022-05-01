/**
 * @file Defines all routes for the App Funds route.
 */

const express = require('express');
const { createInitialStatus, retrieveAppStatus } = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const plaid = require('../plaid');

const router = express.Router();
const { PLAID_CLIENT_ID, PLAID_SECRET_SANDBOX } = process.env;

/**
 * Sets up initial app status if it doesn't already exist.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of app funds
 */
router.get(
  '/initial',
  asyncWrapper(async (req, res) => {
    try {
      const status = await retrieveAppStatus();
      console.log(status);

      if (status.length === 0) {
        // get the last event_id
        const transferEventListRequest = {
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET_SANDBOX,
        };
        const response = await plaid.transferEventList(
          transferEventListRequest
        );

        await createInitialStatus(response.data.transfer_events[0].event_id);
      }

      res.json(status);
    } catch (err) {
      console.log("here's the response", err);
      res.json(err);
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
      console.log(err);
    }
  })
);

module.exports = router;
