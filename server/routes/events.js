/**
 * @file Defines all routes for Link Events.
 */

const express = require('express');
const { PlaidErrorErrorTypeEnum } = require('plaid');

const { createEvent, retrieveEvents } = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const plaid = require('../plaid');

const router = express.Router();

/**
 * Creates a new events from sync .
 *
 */

router.post(
  '/',
  asyncWrapper(async (req, res) => {
    const allEvents = await retrieveEvents();
    const sycnRequest = {
      after_id: allEvents[allEvents.length - 1].plaid_event_id,
      count: 25,
    };
    const syncResponse = await plaid.transferEventSync(sycnRequest);

    await syncResponse.data.transfer_events.forEach(async event => {
      await createEvent(
        event.event_id,
        transfer_response.user_id,
        event.account_id,
        event.transfer_id,
        event.transfer_type,
        event.event_type,
        event.transfer_amount,
        event.sweep_amount,
        event.sweep_id,
        event.failure_reason,
        event.timepstamp
      );
    });

    res.sendStatus(200);
  })
);

module.exports = router;
