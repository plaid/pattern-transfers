/**
 * @file Defines all routes for Link Events.
 */

const express = require('express');
const plaid = require('plaid');

const { asyncWrapper } = require('../middleware');
const axios = require('axios');
const fetch = require('node-fetch');

const router = express.Router();

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
    console.log(`${httpTunnel.public_url}/services/webhook`);
    await axios
      .post(
        'https://sandbox.plaid.com/sandbox/transfer/fire_webhook',
        {
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET_SANDBOX,
          webhook: 'http://e153-38-104-174-146.ngrok.io/services/webhook',
        },
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      )
      .then(response => {
        console.log(response.data);
      });
    // const fireWebhookRequest = {
    //   client_id: PLAID_CLIENT_ID,
    //   secret: PLAID_SECRET_SANDBOX,
    //   webhook: 'http://f2a4-38-104-174-146.ngrok.io/services/webhook',
    // };
    // await plaid.sandboxTransferFireWebhook(fireWebhookRequest);
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
