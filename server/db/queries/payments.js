/**
 * @file Defines the queries for payments table/views.
 */

const db = require('../');

/**
 * Creates an payments account.
 *
 * @param {number} userId the user id of the user.
 * @returns {Object} the payments object for the user.
 */
const createPayments = async userId => {
  const query = {
    // RETURNING is a Postgres-specific clause that returns a list of the inserted payments.
    text:
      'INSERT INTO payments_table (user_id, payments_total, monthly_payment, number_of_payments) VALUES ($1, $2, $3, $4) RETURNING *;',
    values: [userId, 0, 0, 0],
  };
  const { rows: payments } = await db.query(query);
  return payments[0];
};

/**
 * Updates total payments and number of payments for a single user.
 *
 * @param {number} userId the ID of the user.
 * @param {number} paymentsTotal the updated total payments for a user.
 */

const addPayment = async (userId, paymentsTotal, numberOfPayments) => {
  const query = {
    text:
      'UPDATE payments SET payments_total = $1, number_of_payments = $2 WHERE user_id = $3',
    values: [paymentsTotal, numberOfPayments, userId],
  };
  const { rows: payments } = await db.query(query);
  return payments;
};

/**
 * Sets monthly payment amount for a single user.
 *
 * @param {number} userId the ID of the user.
 * @param {number} monthlyPayment the monthly payment for a user.
 */

const setMonthlyPayment = async (userId, monthlyPayment) => {
  const query = {
    text: 'UPDATE payments SET monthly_payment = $1 WHERE user_id = $2',
    values: [monthlyPayment, userId],
  };
  const { rows: payments } = await db.query(query);
  return payments;
};

/**
 * Retrieves payments for a single user.
 *
 * @param {number} userId the ID of the user.
 * @returns {Object[]} an array of payments
 */
const retrievePaymentsByUser = async userId => {
  const query = {
    text: 'SELECT * FROM payments WHERE user_id = $1',
    values: [userId],
  };
  const { rows: payments } = await db.query(query);
  return payments;
};

module.exports = {
  createPayments,
  addPayment,
  setMonthlyPayment,
  retrievePaymentsByUser,
};
