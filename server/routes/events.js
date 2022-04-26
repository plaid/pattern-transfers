/**
 * @file Defines all routes for Link Events.
 */

const express = require('express');
const plaid = require('../plaid');

const { asyncWrapper } = require('../middleware');
const axios = require('axios');
const fetch = require('node-fetch');

const router = express.Router();

const { PLAID_CLIENT_ID, PLAID_SECRET_SANDBOX } = process.env;

/**
 * Creates a new events from sync .
 *
 */

router.post(
  '/sandbox/fire_webhook',
  asyncWrapper(async (req, res) => {
    const response = await fetch('http://ngrok:4040/api/tunnels');

    const { tunnels } = await response.json();
    const httpTunnel = tunnels.find(t => t.proto === 'http');
    // await axios
    //   .post(
    //     'https://sandbox.plaid.com/sandbox/transfer/fire_webhook',
    //     {
    //       client_id: PLAID_CLIENT_ID,
    //       secret: PLAID_SECRET_SANDBOX,
    //       webhook: `${httpTunnel.public_url}/services/webhook`,
    //     },
    //     {
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //     }
    //   )
    //   .then(response => {
    //     console.log(response.data);
    //   });
    const fireWebhookRequest = {
      webhook: `${httpTunnel.public_url}/services/webhook`,
    };
    console.log(fireWebhookRequest);
    const inst = await plaid.institutionsGet({
      count: 5,
      offset: 0,
      country_codes: ['US'],
    });
    console.log(inst.data[0]);
    await plaid.sandboxTransferFireWebhook(fireWebhookRequest);
  })

  // const transferIntentCreateResponse = await axios.post(
  //   `https://sandbox.plaid.com/transfer/intent/create`,
  //   transIntentCreateRequest,
  //   {
  //     headers: {
  //       'content-type': 'application/json',
  //     },
  //   }
);

module.exports = router;
