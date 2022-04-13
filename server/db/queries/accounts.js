/**
 * @file Defines the queries for the accounts table/view.
 */

const { retrieveItemByPlaidItemId } = require('./items');
const db = require('../');

/**
 * Creates multiple accounts related to a single item.
 *
 * @param {string} plaidItemId the Plaid ID of the item.
 * @param {Object[]} accounts an array of accounts.
 * @param {Object} numbers an object of number types.
 * @param {string[]} ownerNames an array of owner names.
 * @param {string[]} emails an array of emails.
 * @returns {Object[]} an array of new accounts.
 */
const createAccount = async (plaidItemId, userId, account) => {
  const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);

  const { id: aid, name, subtype } = account;
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        INSERT INTO accounts_table
          (
            item_id,
            plaid_account_id,
            name,
            subtype,
            user_id,
            plaid_item_id
          )
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          *
      `,
    values: [itemId, aid, name, subtype, userId, plaidItemId],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Retrieves the account associated with a Plaid account ID.
 *
 * @param {string} plaidAccountId the Plaid ID of the account.
 * @returns {Object} a single account.
 */
const retrieveAccountByPlaidAccountId = async plaidAccountId => {
  const query = {
    text: 'SELECT * FROM accounts WHERE plaid_account_id = $1',
    values: [plaidAccountId],
  };
  const { rows } = await db.query(query);
  // since Plaid account IDs are unique, this query will never return more than one row.
  return rows[0];
};

/**
 * Retrieves the accounts for a single item.
 *
 * @param {number} itemId the ID of the item.
 * @returns {Object[]} an array of accounts.
 */
const retrieveAccountsByItemId = async itemId => {
  const query = {
    text: 'SELECT * FROM accounts WHERE item_id = $1 ORDER BY id',
    values: [itemId],
  };
  const { rows: accounts } = await db.query(query);
  return accounts;
};

/**
 * Retrieves all accounts for a single user.
 *
 * @param {number} userId the ID of the user.
 *
 * @returns {Object[]} an array of accounts.
 */
const retrieveAccountsByUserId = async userId => {
  const query = {
    text: 'SELECT * FROM accounts WHERE user_id = $1 ORDER BY id',
    values: [userId],
  };
  const { rows: accounts } = await db.query(query);
  return accounts;
};

module.exports = {
  createAccount,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
};
