/**
 * @file Defines the queries for the app_funds table/views.
 */

const db = require('..');

/**
 * Creates initial app status.
 *
 * @returns {Object} the new app fund for the user.
 */
const createInitialStatus = async numberOfEvents => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns the inital status.
    text:
      'INSERT INTO app_status_table (number_of_events, app_account_balance) VALUES ($1, $2) RETURNING *;',
    values: [numberOfEvents, 0],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Updates number of events for app.
 *
 * @param {number} id the ID of the app.
 * @param {number} numberOfEvents the initial number of the events for the clientId for the app.
 */

const setNumberOfEvents = async numberOfEvents => {
  const query = {
    text: 'UPDATE app_status SET number_of_events = $1 WHERE id = $2',
    values: [numberOfEvents, 1],
  };
  await db.query(query);
};

/**
 * Updates balance for app.
 *
 * @param {number} id the ID of the app.
 * @param {number} appAccountBalance the updated balance for the app.
 */

const updateAppStatus = async (appAccountBalance, numberOfEvents) => {
  const query = {
    text:
      'UPDATE app_status SET app_account_balance = $1, number_of_events = $2 WHERE id = $3',
    values: [appAccountBalance, numberOfEvents, 1],
  };
  await db.query(query);
};

/**
 * Retrieves app status
 *
 * @param {number} userId the ID of the user.
 * @returns {Object[]} an array of app Funds.
 */
const retrieveAppStatus = async () => {
  const query = {
    text: 'SELECT * FROM app_status',
  };
  const { rows: appFunds } = await db.query(query);
  return appFunds;
};

module.exports = {
  createInitialStatus,
  setNumberOfEvents,
  updateAppStatus,
  retrieveAppStatus,
};
