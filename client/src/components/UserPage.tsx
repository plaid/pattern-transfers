import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import NavigationLink from 'plaid-threads/NavigationLink';
import Button from 'plaid-threads/Button';
import { LinkButton } from '.';

import {
  RouteInfo,
  ItemType,
  AccountType,
  UserType,
  TransferType,
} from './types';
import {
  useItems,
  useAccounts,
  useUsers,
  useLink,
  useTransfers,
  usePayments,
} from '../services';

import { Banner, Item, ErrorMessage, TransferForm, UserTransfers } from '.';

const UserPage = ({ match }: RouteComponentProps<RouteInfo>) => {
  const [user, setUser] = useState<UserType>({
    id: 0,
    username: null,
    created_at: '',
    updated_at: '',
  });

  const [transfers, setTransfers] = useState<null | TransferType[]>(null);

  const { generateLinkToken, linkTokens } = useLink();
  const {
    generateTransferIntentId,
    getTransfersByUser,
    transfersByUser,
  } = useTransfers();
  const [item, setItem] = useState<ItemType | null>(null);
  const [numOfItems, setNumOfItems] = useState(0);
  const [account, setAccount] = useState<AccountType | null>(null);

  const [token, setToken] = useState<string | null>('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('0');
  const [numberOfPayments, setNumberOfPayments] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const { getAccountsByUser, accountsByUser } = useAccounts();
  const { getPaymentsByUser, paymentsByUser } = usePayments();
  const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
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
      getPaymentsByUser(userId);
    }
  }, [getItemsByUser, getPaymentsByUser, userId]);

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
  }, [getPaymentsByUser, userId, itemsByUser]);

  // update state payment data from data store
  useEffect(() => {
    if (paymentsByUser[userId] != null && paymentsByUser[userId].length > 0) {
      setNumberOfPayments(paymentsByUser[userId][0].number_of_payments);
      setMonthlyPayment(paymentsByUser[userId][0].monthly_payment);
    }
  }, [paymentsByUser, userId, itemsByUser, numOfItems]);

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

  // update no of items from data store
  useEffect(() => {
    if (transfersByUser[userId] != null) {
      setTransfers(transfersByUser[userId]);
    } else {
      setTransfers(null);
    }
  }, [transfersByUser, userId]);

  const initiateLink = async () => {
    // make call to transfer/intent/create to get transfer_intent_id to pass to link token creation for Transfer UI
    const transfer_intent_id = await generateTransferIntentId(
      userId,
      Number(subscriptionAmount)
    );
    // only generate a link token upon a click from enduser to add a bank;
    // if done earlier, it may expire before enuser actually activates Link to add a bank.
    await generateLinkToken(userId, null, transfer_intent_id);
  };
  const accountName = account != null ? `${account.name}` : '';
  const myAccountMessage =
    numOfItems === 0
      ? [
          <span>Add a bank account to pay for your</span>,
          <span className="subscription-amount">
            {' '}
            $
            {`${Number(subscriptionAmount)
              .toFixed(2)
              .toString()}`}{' '}
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

      <Banner username={user.username} />
      <div className="user-page-container">
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
                  <LinkButton userId={userId} token={token} itemId={null} />
                )}
              </div>
              <p className="nacha-compliant-note">
                IMPORTANT NOTE: You will need to include appropraite legal
                authorization language here to capture NACHA-compliant
                authorzation prior to initiating a transfer.
              </p>
            </div>
          )}
          {numOfItems > 0 && (
            <>
              <Item
                user={user}
                userId={userId}
                removeButton={false}
                linkButton={numOfItems === 0}
                numOfItems={numOfItems}
                accountName={accountName}
                item={item}
                subscriptionAmount={monthlyPayment.toString()}
              />
              <UserTransfers transfers={transfers} />
            </>
          )}
          <ErrorMessage />
        </div>
        <div className="user-page-right">
          <TransferForm
            setSubscriptionAmount={setSubscriptionAmount}
            numOfItems={numOfItems}
            numberOfPayments={numberOfPayments}
            userId={userId}
            monthlyPayment={monthlyPayment}
          />
        </div>
      </div>
    </div>
  );
};

UserPage.displayName = 'UserPage';
export default UserPage;
