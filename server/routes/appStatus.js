/**
 * @file Defines all routes for the App Funds route.
 */

const express = require('express');
const {
  createInitialStatus,
  setNumberOfEvents,
  updateAppAccountBalance,
  retrieveAppStatus,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const plaid = require('../plaid');

const router = express.Router();

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

      if (status.length === 0) {
        // get all events associated with clientId in order to get the last event_id
        let afterId = 0;
        let events = [];
        let eventsToFetch = true;
        const count = 25;
        while (eventsToFetch) {
          //fetch the events
          const sycnRequest = {
            after_id: afterId,
            count: count,
          };
          const response = await plaid.transferEventSync(sycnRequest);
          events = [...events, ...response.data.transfer_events];
          if (response.data.transfer_events.length === count) {
            afterId += count;
          } else {
            eventsToFetch = false;
          }
          events.sort((a, b) => (a.event_id > b.event_id ? -1 : 1));
        }
        await createInitialStatus(events[0].event_id);
      }

      res.json(status);
    } catch (err) {
      console.log(err);
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
