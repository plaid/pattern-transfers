/**
 * @file Defines all routes for the transfers route.
 */

const express = require('express');
const {
  addPayment,
  setMonthlyPayment,
  retrievePaymentsByUser,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');

const router = express.Router();

/**
 * Updates the payments total
 *
 *  @param {number} userId the ID of the user.
 *  @param {number} paymentAmount the amount being transferred.
 * @return {Object{}} the new appFund and new account objects.
 */
router.put(
  '/:userId/add_payment',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { paymentAmount } = req.body;
    const payments = await retrievePaymentsByUser(userId);
    const oldTotal = payments[0].payments_total;
    const oldNumberOfPayments = payments[0].number_of_payments;
    const newTotal = oldTotal + paymentAmount;
    const newNumberOfPayments = oldNumberOfPayments + 1;
    await addPayment(userId, newTotal, newNumberOfPayments);
    const updatedPayments = await retrievePaymentsByUser(userId);
    res.json(updatedPayments);
  })
);

module.exports = router;

/**
 * Updates the payments total
 *
 *  @param {number} userId the ID of the user.
 *  @param {number} monthlyPayment the amount being transferred.
 * @return {Object{}} the new appFund and new account objects.
 */
router.put(
  '/:userId/set_monthly_payment',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { monthlyPayment } = req.body;
    console.log(userId, monthlyPayment);
    await setMonthlyPayment(userId, monthlyPayment);
    const updatedPayments = await retrievePaymentsByUser(userId);
    res.json(updatedPayments);
  })
);

module.exports = router;
