/**
 * @file Defines the queries for the accounts table/view.
 */

const db = require('../');

/**
 * Creates transfer related to a single item from the Transfer UI
 *
 * @param {number} itemId the item id.
 * @param {number} userId the user Id.
 * @param {string} accountId the plaid account id of the origin account.
 * @param {string} destinationId the plaid account id of the destination account.
 * @param {string} transferIntentId the transfer intent id of the transfer (for TransferUI only).
 * @param {string} authorizationId the authorization id of the transfer.
 * @param {string} transferId the transfer id of the transfer.
 * @param {number} amount the amount of the transfer.
 * @param {string} status the status of the transfer.
 * @param {string} sweepStatus the sweep status of the transfer.
 * @returns {Object} the new transfer.
 */
const createTransfer = async (
  itemId,
  userId,
  accountId,
  transferIntentId,
  authorizationId,
  transferId,
  amount,
  status,
  type,
  sweepStatus
) => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        INSERT INTO transfers_table
          (
            item_id,
            user_id,
            plaid_account_id,
            transfer_intent_id,
            authorization_id,
            transfer_id,
            amount,
            status,
            type,
            sweep_status
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          *;
      `,
    values: [
      itemId,
      userId,
      accountId,
      transferIntentId,
      authorizationId,
      transferId,
      amount,
      status,
      type,
      sweepStatus,
    ],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Updates data in a transfer.
 *
 * @param {number} itemId the item id.
 * @param {string} accountId the plaid account id of the origin account.
 * @param {string} destinationId the plaid account id of the destination account.
 * @param {string} transferIntentId the transfer intent id of the transfer (for TransferUI only).
 * @param {string} authorizationId the authorization id of the transfer.
 * @param {string} transferId the transfer id of the transfer.
 * @param {number} amount the amount of the transfer.
 * @param {string} status the status of the transfer.
 * @param {string} sweepStatus the sweep status of the transfer.
 * @returns {Object} the new transfer.
 */
const addTransferInfo = async (
  status,
  transferId,
  accountId,
  sweepStatus,
  itemId,
  type,
  transferIntentId
) => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        UPDATE transfers SET status = $1, transfer_id = $2, plaid_account_id = $3, sweep_status = $4, item_id = $5, type = $6 WHERE transfer_intent_id = $7;
      `,
    values: [
      status,
      transferId,
      accountId,
      sweepStatus,
      itemId,
      type,
      transferIntentId,
    ],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Updates status in a transfer.
 *
 * @param {string} transferId the transfer id of the transfer.
 * @param {string} status the status of the transfer.
 * @param {string} sweepStatus the sweep status of the transfer.
 * @returns {Object} the new transfer.
 */
const updateTransferStatus = async (status, sweepStatus, transferId) => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        UPDATE transfers SET status = $1, sweep_status = $2 WHERE transfer_id = $3
      `,
    values: [status, sweepStatus, transferId],
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
 * Retrieves the transfer by the plaid transfer id.
 *
 * @param {string} transferId the plaid transfer ID of the transfer.
 * @returns {Object[]} an array of transfers.
 */
const retrieveTransferByPlaidTransferId = async transferId => {
  const query = {
    text: 'SELECT * FROM transfers WHERE transfer_id = $1 ORDER BY id',
    values: [transferId],
  };
  const { rows: transfers } = await db.query(query);
  return transfers[0];
};

/**
 * Retrieves all transfers for a single user.
 *
 * @param {number} userId the ID of the user.
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
  createTransfer,
  retrieveTransfersByItemId,
  retrieveTransfersByUserId,
  addTransferInfo,
  updateTransferStatus,
  retrieveTransferByPlaidTransferId,
};
