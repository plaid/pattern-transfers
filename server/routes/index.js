/**
 * @file Defines all root routes for the application.
 */

const usersRouter = require('./users');
const sessionsRouter = require('./sessions');
const itemsRouter = require('./items');
const accountsRouter = require('./accounts');
const institutionsRouter = require('./institutions');
const serviceRouter = require('./services');
const linkEventsRouter = require('./linkEvents');
const unhandledRouter = require('./unhandled');
const linkTokensRouter = require('./linkTokens');
const transfersRouter = require('./transfers');
const paymentsRouter = require('./payments');
const eventsRouter = require('./events');
const appStatusRouter = require('./appStatus');

module.exports = {
  usersRouter,
  itemsRouter,
  accountsRouter,
  institutionsRouter,
  serviceRouter,
  linkEventsRouter,
  linkTokensRouter,
  unhandledRouter,
  sessionsRouter,
  transfersRouter,
  paymentsRouter,
  eventsRouter,
  appStatusRouter,
};
