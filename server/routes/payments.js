/**
 * @file Defines all routes for the transfers route.
 */

const express = require('express');
const axios = require('axios');
const {
  updatePaymentsTotal,
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
    console.log(payments);
    const oldTotal = payments[0].payments_total;
    const oldNumberOfPayments = payments[0].number_of_payments;
    const newTotal = oldTotal + paymentAmount;
    const newNumberOfPayments = oldNumberOfPayments + 1;
    console.log(newTotal, newNumberOfPayments);
    const updatedPayments = await updatePaymentsTotal(
      userId,
      newTotal,
      newNumberOfPayments
    );
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
    const payments = await setMonthlyPayment(userId, monthlyPayment);
    console.log(payments);
    res.json(payments);
  })
);

module.exports = router;
