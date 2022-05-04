/**
 * @file Defines all routes for Link Events.
 */

const express = require('express');
const plaid = require('../plaid');

const { asyncWrapper } = require('../middleware');
const fetch = require('node-fetch');

const router = express.Router();

/**
 * sends sandbox transfer webhook
 *
 */

router.post(
  '/sandbox/fire_webhook',
  asyncWrapper(async (req, res) => {
    try {
      const response = await fetch('http://ngrok:4040/api/tunnels');
      const { tunnels } = await response.json();
      const httpTunnel = tunnels.find(t => t.proto === 'http');
      const fireWebhookRequest = {
        webhook: `${httpTunnel.public_url}/services/webhook`,
      };
      await plaid.sandboxTransferFireWebhook(fireWebhookRequest);
    } catch (err) {
      errorHandler(err);
    }
  })
);

module.exports = router;
