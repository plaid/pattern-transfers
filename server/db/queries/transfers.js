/**
 * @file Defines the queries for the accounts table/view.
 */

const { retrieveItemByPlaidItemId } = require('./items');
const db = require('../');

/**
 * Creates transfer related to a single item from the Transfer UI
 *
 * @param {string} plaidItemId the Plaid ID of the item.
 * @param {number} userId the user Id.
 * @param {string} accountId the plaid account id of the origin account.
 * @param {string} destinationId the plaid account id of the destination account.
 * @param {string} transferIntentId the transfer intent id of the transfer.
 * @param {number} amount the amount of the transfer.
 * @returns {Object} the new transfer.
 */
const createTransferWithTransferUI = async (
  itemId,
  userId,
  accountId,
  destinationId,
  transferIntentId,
  amount
) => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        INSERT INTO transfers_table
          (
            item_id,
            user_id,
            plaid_account_id,
            destination_account_id,
            transfer_intent_id,
            authorization_id,
            transfer_id,
            amount,
            status
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          *
      `,
    values: [
      null,
      userId,
      'none yet',
      'none yet',
      transferIntentId,
      'none',
      'none yet',
      amount,
      'no status yet',
    ],
  };
  const { rows } = await db.query(query);
  return rows[0];
};
/**
 * Retrieves the transfers for a single item.
 *
 * @param {number} itemId the ID of the item.
 * @returns {Object[]} an array of transfers.
 */
const retrieveTransfersByItemId = async itemId => {
  const query = {
    text: 'SELECT * FROM transfers WHERE item_id = $1 ORDER BY id',
    values: [itemId],
  };
  const { rows: transfers } = await db.query(query);
  return transfers;
};

/**
 * Retrieves all transfers for a single user.
 *
 * @param {number} userId the ID of the user.
 *
 * @returns {Object[]} an array of accounts.
 */
const retrieveTransfersByUserId = async userId => {
  const query = {
    text: 'SELECT * FROM transfers WHERE user_id = $1 ORDER BY id',
    values: [userId],
  };
  const { rows: transfers } = await db.query(query);
  return transfers;
};

module.exports = {
  createTransferWithTransferUI,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
};
