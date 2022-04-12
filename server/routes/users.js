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
  updateIdentityCheck,
  retrieveUserById,
  updateUserInfo,
  updateAppFundsBalance,
  createAppFund,
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
    const { username, fullname, email, shouldVerifyIdentity } = req.body;
    const usernameExists = await retrieveUserByUsername(username);
    // prevent duplicates
    if (usernameExists)
      throw new Boom('Username already exists', { statusCode: 409 });
    const newUser = await createUser(
      username,
      fullname,
      email,
      shouldVerifyIdentity
    );
    await createAppFund(newUser.id);
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
 * Updates user identity check.
 *
 * @param {string} userId the ID of the user.
 * @param {boolean} identityCheck true or false identity checked.
 * @returns {Object[]} an array of accounts.
 */
router.put(
  '/:userId/identity_check',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { identityCheck } = req.body;
    await updateIdentityCheck(userId, identityCheck);
    const accounts = await retrieveAccountsByUserId(userId);
    res.json(sanitizeAccounts(accounts));
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
