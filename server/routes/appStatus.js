/**
 * @file Defines all routes for the App Funds route.
 */

const express = require('express');
const {
  createInitialStatus,
  retrieveEvents,
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
      let lastEventId = 0;

      if (status.length === 0) {
        // if no app status, create it
        const allEvents = await retrieveEvents();
        if (allEvents.length > 0) {
          // get last event id and save it to database
          lastEventId = allEvents[allEvents.length - 1].event_id;
        } else {
          // if no events in database, get all events associated with clientId in order to get the last event_id
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
          lastEventId = events[0].event_id;
        }
        await createInitialStatus(lastEventId);
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
