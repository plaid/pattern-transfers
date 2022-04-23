/**
 * @file Defines the queries for the accounts table/view.
 */

const db = require('../');

/**
 * Creates transfer related to a single item from the Transfer UI
 *
 * @param {number} eventId the plaid event Id.
 * @param {number} userId the user Id.
 * @param {string} accountId the plaid account id of user account.
 * @param {string} transferId the transfer id of the transfer.
 * @param {string} transferType the transfer type.
 * @param {string} eventType the event type.
 * @param {number} amount the amount of the transfer.
 * @param {number }sweeepAmount  the sweep amount of the transfer.
 * @param {string} sweepId the sweep id of the transfer.
 * @param {string} failureReaon the failure reason of the evnt.
 * @param {string} timestamp the datetime when the event occurred.
 * @returns {Object} the new event.
 */
const createEvent = async (
  eventId,
  userId,
  accountId,
  transferId,
  transferType,
  eventType,
  amount,
  sweeepAmount,
  sweepId,
  failureReaon,
  timestamp
) => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted items.
    text: `
        INSERT INTO transfers_table
          (
            plaid_event_id,
            user_id,
            plaid_account_id,
            transfer_id,
            transfer_type,
            event_type,
            amount,
            sweep_amount,
            sweep_id,
            failure_reason,
            timestamp
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          *
      `,
    values: [
      eventId,
      userId,
      accountId,
      transferId,
      transferType,
      eventType,
      amount,
      sweeepAmount,
      sweepId,
      failureReaon,
      timestamp,
    ],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

module.exports = {
  createEvent,
};
