/**
 * @file Defines the route for link token creation.
 */

const { asyncWrapper } = require('../middleware');

const express = require('express');
const axios = require('axios');
const plaid = require('../plaid');
const fetch = require('node-fetch');
const { retrieveUserById, createTransfer } = require('../db/queries');
const { create } = require('lodash');
const {
  PLAID_SANDBOX_REDIRECT_URI,
  PLAID_DEVELOPMENT_REDIRECT_URI,
  PLAID_ENV,
  PLAID_CLIENT_ID,
  PLAID_SECRET_SANDBOX,
  LINK_CUSTOMIZATION_NAME,
} = process.env;

const redirect_uri =
  PLAID_ENV == 'sandbox'
    ? PLAID_SANDBOX_REDIRECT_URI
    : PLAID_DEVELOPMENT_REDIRECT_URI;
const router = express.Router();

router.post(
  '/transfer_link_token',
  asyncWrapper(async (req, res) => {
    try {
      const { userId, subscriptionAmount } = req.body;

      // get transfer intent id to pass to create/link/token
      const createTransferIntent = async () => {
        const { username: username } = await retrieveUserById(userId);
        const transIntentCreateRequest = {
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET_SANDBOX,
          mode: 'PAYMENT',
          amount: subscriptionAmount.toFixed(2),
          ach_class: 'ppd',
          description: 'payment', // cannot be longer than 8 characters
          user: {
            legal_name: username,
          },
        };

        const transferIntentCreateResponse = await plaid.transferIntentCreate(
          transIntentCreateRequest
        );
        const transferIntentId =
          transferIntentCreateResponse.data.transfer_intent.id;
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
        return transferIntentId;
      };

      // create link token using transfer intent id
      const createLinkTokenForTransfer = async () => {
        let products = ['transfer'];
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
          transfer: {
            intent_id: transferIntentId,
          },
          link_customization_name: LINK_CUSTOMIZATION_NAME,
        };
        // If user has entered a redirect uri in the .env file
        if (redirect_uri.indexOf('http') === 0) {
          linkTokenParams.redirect_uri = redirect_uri;
        }

        return await plaid.linkTokenCreate(linkTokenParams);
      };

      const transferIntentId = await createTransferIntent();
      const createLinkTokenResponse = await createLinkTokenForTransfer();

      res.json(createLinkTokenResponse.data);
    } catch (err) {
      console.log('error while fetching client token', err.response.data);
      return res.json(err);
    }
  })
);

module.exports = router;
