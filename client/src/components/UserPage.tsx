import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import NavigationLink from 'plaid-threads/NavigationLink';
import Button from 'plaid-threads/Button';
import Callout from 'plaid-threads/Callout';
import { LinkButton } from '.';

import {
  RouteInfo,
  ItemType,
  AccountType,
  UserType,
  TransferType,
  PaymentType,
} from './types';
import {
  useItems,
  useAccounts,
  useUsers,
  useLink,
  useTransfers,
  usePayments,
} from '../services';

import {
  Banner,
  Item,
  ErrorMessage,
  TransferForm,
  UserTransfers,
  Ledger,
} from '.';

const UserPage = ({ match }: RouteComponentProps<RouteInfo>) => {
  const [user, setUser] = useState<UserType>({
    id: 0,
    username: null,
    created_at: '',
    updated_at: '',
  });
  const [isLedgerView, setIsLedgerView] = useState(false);
  const [transfers, setTransfers] = useState<null | TransferType[]>(null);
  const [item, setItem] = useState<ItemType | null>(null);
  const [numOfItems, setNumOfItems] = useState(0);
  const [account, setAccount] = useState<AccountType | null>(null);

  const [token, setToken] = useState<string | null>('');
  const [payments, setPayments] = useState<null | PaymentType>(null);
  const { getAccountsByUser, accountsByUser } = useAccounts();
  const { getPaymentsByUser, paymentsByUser } = usePayments();
  const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
  const { generateLinkToken, linkTokens } = useLink();
  const {
    generateTransferIntentId,
    getTransfersByUser,
    transfersByUser,
  } = useTransfers();
  const userId = Number(match.params.userId);

  useEffect(() => {
    getUserById(userId, false);
  }, [getUserById, userId]);

  useEffect(() => {
    setUser(usersById[userId] || {});
  }, [usersById, userId]);
  // update data store with the user's item
  useEffect(() => {
    if (userId != null) {
      getItemsByUser(userId, true);
    }
  }, [getItemsByUser, userId]);

  // update state item from data store
  useEffect(() => {
    const newItems: Array<ItemType> = itemsByUser[userId] || [];
    setItem(newItems[0]);
  }, [itemsByUser, userId]);

  // update state number of items from data store
  useEffect(() => {
    if (itemsByUser[userId] != null) {
      setNumOfItems(itemsByUser[userId].length);
    } else {
      setNumOfItems(0);
    }
  }, [itemsByUser, userId]);

  // update data store with the user's account
  useEffect(() => {
    getAccountsByUser(userId);
  }, [getAccountsByUser, userId, numOfItems]);

  // update state account from data store
  useEffect(() => {
    if (accountsByUser[userId] != null && accountsByUser[userId].length > 0) {
      setAccount(accountsByUser[userId][0]);
    }
  }, [accountsByUser, userId, numOfItems]);

  // // update data store with the user's payments
  useEffect(() => {
    getPaymentsByUser(userId);
  }, [getPaymentsByUser, userId]);

  // update state payment data from data store
  useEffect(() => {
    if (paymentsByUser[userId] != null && paymentsByUser[userId].length > 0) {
      setPayments(paymentsByUser[userId][0]);
    }
  }, [paymentsByUser, userId]);

  useEffect(() => {
    if (numOfItems === 0) {
      setToken(linkTokens.byUser[userId]);
    } else {
      setToken(null);
    }
  }, [linkTokens, userId, numOfItems]);

  // update data store with the user's transfers
  useEffect(() => {
    getTransfersByUser(userId);
  }, [getTransfersByUser, userId]);

  // update state transfers from data store
  useEffect(() => {
    if (transfersByUser[userId] != null) {
      setTransfers(transfersByUser[userId]);
    } else {
      setTransfers(null);
    }
  }, [transfersByUser, userId]);

  const monthlyPayment = payments != null ? payments.monthly_payment : 0;

  const initiateLink = async () => {
    // make call to transfer/intent/create to get transfer_intent_id to pass to link token creation for Transfer UI

    const transfer_intent_id = await generateTransferIntentId(
      userId,
      monthlyPayment
    );
    // only generate a link token upon a click from enduser to add a bank;
    // if done earlier, it may expire before enduser actually activates Link to add a bank.
    await generateLinkToken(userId, null, transfer_intent_id);
  };
  const accountName = account != null ? `${account.name}` : '';
  const myAccountMessage =
    numOfItems === 0
      ? [
          <span>Add a bank account to pay for your</span>,
          <span className="subscription-amount">
            {' '}
            ${`${monthlyPayment.toFixed(2).toString()}`}{' '}
          </span>,
          <span>PlatyFlix subscription using Plaid!!</span>,
        ]
      : `Thank you for making your monthly payments!`;

  document.getElementsByTagName('body')[0].style.overflow = 'auto'; // to override overflow:hidden from link pane

  return (
    <div>
      <NavigationLink component={Link} to="/">
        LOGOUT
      </NavigationLink>

      <Banner
        username={user.username}
        isLedgerView={isLedgerView}
        setIsLedgerView={setIsLedgerView}
      />
      <div className="user-page-container">
        {!isLedgerView && (
          <div className="user-view-container">
            <div className="user-page-left">
              <h4>My Account: Manage Payments</h4>
              <p>{myAccountMessage}</p>
              {numOfItems === 0 && (
                <div>
                  <Button
                    centered
                    className="add-account__button"
                    onClick={initiateLink}
                  >
                    Pay first month with bank account
                  </Button>
                  {/* // Plaid React Link cannot be rendered without a link token */}
                  <div className="item__button">
                    {token != null && (
                      <LinkButton
                        userId={userId}
                        token={token}
                        itemId={null}
                        setPayments={setPayments}
                      />
                    )}
                  </div>
                  <p className="nacha-compliant-note">
                    IMPORTANT NOTE: You will need to include appropriate legal
                    authorization language here to capture NACHA-compliant
                    authorzation prior to initiating a transfer.
                  </p>
                  <div className="item__callouts">
                    {linkTokens.error.error_code != null && (
                      <Callout warning>
                        <div>
                          Unable to fetch link_token: please make sure your
                          backend server is running and that your .env file has
                          been configured correctly.
                        </div>
                        <div>
                          Error Code: <code>{linkTokens.error.error_code}</code>
                        </div>
                        <div>
                          Error Type: <code>{linkTokens.error.error_type}</code>{' '}
                        </div>
                        <div>
                          Error Message: {linkTokens.error.error_message}
                        </div>
                      </Callout>
                    )}
                  </div>
                </div>
              )}
              {numOfItems > 0 && (
                <>
                  <Item
                    user={user}
                    userId={userId}
                    removeButton={false}
                    linkButton={numOfItems === 0}
                    accountName={accountName}
                    payments={payments}
                    item={item}
                  />
                  <UserTransfers transfers={transfers} />
                </>
              )}
              <ErrorMessage />
            </div>
            <div className="user-page-right">
              <TransferForm
                numOfItems={numOfItems}
                payments={payments}
                userId={userId}
                setPayments={setPayments}
                setTransfers={setTransfers}
                setIsLedgerView={setIsLedgerView}
                item={item}
              />
            </div>
          </div>
        )}
        {isLedgerView && (
          <Ledger transfers={transfers} setIsLedgerView={setIsLedgerView} />
        )}
      </div>
    </div>
  );
};

UserPage.displayName = 'UserPage';
export default UserPage;
