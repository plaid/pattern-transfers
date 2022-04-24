/**
 * @file Defines all routes for the Users route.
 */

const express = require('express');
const Boom = require('@hapi/boom');
const {
  retrieveUsers,
  retrieveUserByUsername,
  retrieveAccountsByUserId,
  createUser,
  deleteUsers,
  retrieveItemsByUser,
  retrieveUserById,
  retrieveTransfersByUserId,
  createPayments,
  retrievePaymentsByUser,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const { sanitizeAccounts, sanitizeItems, sanitizeUsers } = require('../util');

const router = express.Router();

const plaid = require('../plaid');

/**
 * Retrieves all users.
 *
 * @returns {Object[]} an array of users.
 */
router.get(
  '/',
  asyncWrapper(async (req, res) => {
    const users = await retrieveUsers();
    res.json(sanitizeUsers(users));
  })
);

/**
 * Creates a new user (unless the username is already taken).
 *
 * @TODO make this return an array for consistency.
 *
 * @param {string} username the username of the new user.
 * @returns {Object[]} an array containing the new user.
 */
router.post(
  '/',
  asyncWrapper(async (req, res) => {
    const { username } = req.body;
    const usernameExists = await retrieveUserByUsername(username);
    // prevent duplicates
    if (usernameExists)
      throw new Boom('Username already exists', { statusCode: 409 });
    const newUser = await createUser(username);
    console.log('new user:', newUser);
    await createPayments(newUser.id);
    res.json(sanitizeUsers(newUser));
  })
);

/**
 * Retrieves user information for a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array containing a single user.
 */
router.get(
  '/:userId',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const user = await retrieveUserById(userId);
    res.json(sanitizeUsers(user));
  })
);

/**
 * Retrieves all items associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of items.
 */
router.get(
  '/:userId/items',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const items = await retrieveItemsByUser(userId);
    res.json(sanitizeItems(items));
  })
);

/**
 * Retrieves all accounts associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of accounts.
 */
router.get(
  '/:userId/accounts',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const accounts = await retrieveAccountsByUserId(userId);
    res.json(sanitizeAccounts(accounts));
  })
);

/**
 * Retrieves all transfers associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of accounts.
 */
router.get(
  '/:userId/transfers',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const transfers = await retrieveTransfersByUserId(userId);
    res.json(transfers);
  })
);

/**
 * Retrieves payments for a single user
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of app funds
 */
router.get(
  '/:userId/payments',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const payments = await retrievePaymentsByUser(userId);
    res.json(payments);
  })
);

/**
 * Updates user info from identity confirmation.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of accounts.
 */
router.put(
  '/:userId/confirmation',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { fullname, email } = req.body;
    await updateUserInfo(userId, fullname, email);
    const user = await retrieveUserById(userId);
    res.json(sanitizeUsers(user));
  })
);

/**
 * Deletes a user and its related items
 *
 * @param {string} userId the ID of the user.
 */
router.delete(
  '/:userId',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;

    // removes all items from Plaid services associated with the user. Once removed, the access_token
    // associated with an Item is no longer valid and cannot be used to
    // access any data that was associated with the Item.

    // @TODO wrap promise in a try catch block once proper error handling introduced
    const items = await retrieveItemsByUser(userId);
    await Promise.all(
      items.map(({ plaid_access_token: token }) =>
        plaid.itemRemove({ access_token: token })
      )
    );

    // delete from the db
    await deleteUsers(userId);
    res.sendStatus(204);
  })
);

module.exports = router;
