/**
 * @file Defines the route for link token creation.
 */

const { asyncWrapper } = require('../middleware');

const express = require('express');
const axios = require('axios');
const plaid = require('../plaid');
const fetch = require('node-fetch');
const { retrieveItemById } = require('../db/queries');
const {
  PLAID_SANDBOX_REDIRECT_URI,
  PLAID_DEVELOPMENT_REDIRECT_URI,
  PLAID_ENV,
  PLAID_CLIENT_ID,
  PLAID_SECRET_SANDBOX,
} = process.env;

const redirect_uri =
  PLAID_ENV == 'sandbox'
    ? PLAID_SANDBOX_REDIRECT_URI
    : PLAID_DEVELOPMENT_REDIRECT_URI;
const router = express.Router();

router.post(
  '/',
  asyncWrapper(async (req, res) => {
    try {
      const { userId, itemId, transferIntentId } = req.body;
      let accessToken = null;
      let products = ['transfer'];

      if (itemId != null) {
        // for the link update mode, include access token and an empty products array
        // ask transfers team what to do with TransferUI and update mode...do i remove the transfer
        // intent id and link customization name if we are in update mode?
        const itemIdResponse = await retrieveItemById(itemId);
        accessToken = itemIdResponse.plaid_access_token;
        products = [];
      }
      const response = await fetch('http://ngrok:4040/api/tunnels');
      const { tunnels } = await response.json();
      const httpTunnel = tunnels.find(t => t.proto === 'http');
      const linkTokenParams = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_SANDBOX,
        user: {
          // This should correspond to a unique id for the current user.
          client_user_id: 'uniqueId' + userId,
        },
        client_name: 'Pattern',
        products,
        country_codes: ['US'],
        language: 'en',
        webhook: httpTunnel.public_url + '/services/webhook',
        access_token: accessToken,
        transfer: {
          intent_id: transferIntentId,
        },
        link_customization_name: 'transfer_ui_woo',
      };

      // If user has entered a redirect uri in the .env file
      if (redirect_uri.indexOf('http') === 0) {
        linkTokenParams.redirect_uri = redirect_uri;
      }

      const createResponse = await plaid.linkTokenCreate(linkTokenParams);
      res.json(createResponse.data);
    } catch (err) {
      console.log('error while fetching client token', err.response.data);
      return res.json(err.response.data);
    }
  })
);

module.exports = router;
