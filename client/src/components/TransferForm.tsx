import React, { useState } from 'react';

import { NumberInput } from 'plaid-threads/NumberInput';
import { Button } from 'plaid-threads/Button';
import { currencyFilter } from '../util';
import { setMonthlyPayment, createTransfer, addPayment } from '../services/api';
import { PaymentType, ItemType, TransferType } from './types';

interface Props {
  setPayments: (payment: PaymentType) => void;
  setTransfers: (transfers: TransferType[]) => void;
  numOfItems: number;
  userId: number;
  payments: null | PaymentType;
  item: null | ItemType;
}
const TransferForm: React.FC<Props> = (props: Props) => {
  const [transferAmount, setTransferAmount] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const response = await setMonthlyPayment(
      props.userId,
      Number(transferAmount)
    );

    props.setPayments(response.data[0]);

    await setTransferAmount(
      `$${Number(transferAmount)
        .toFixed(2)
        .toString()}`
    );
  };
  const itemId = props.item != null ? props.item.id : 0;
  const monthlyPayment =
    props.payments != null ? props.payments.monthly_payment : 0;

  const initiateTransfer = async () => {
    const transfersResponse = await createTransfer(
      props.userId,
      itemId,
      monthlyPayment
    );
    props.setTransfers(transfersResponse.data);
    const paymentsResponse = await addPayment(props.userId, monthlyPayment);
    console.log(paymentsResponse.data);
    props.setPayments(paymentsResponse.data[0]);
  };

  const numberOfPayments =
    props.payments != null ? props.payments.number_of_payments : 0;

  const amt =
    parseFloat(transferAmount) > 0
      ? currencyFilter(parseFloat(transferAmount))
      : '';
  return (
    <>
      <div className="box developer-configs">
        <h4 className="subheading">Developer Configs</h4>{' '}
        <form className="developer-configs_form" onSubmit={handleSubmit}>
          <NumberInput
            id="transferAmount"
            name="transfer amount"
            value={transferAmount}
            required
            placeholder={transferAmount}
            label="Subscription price"
            onChange={e => {
              setTransferAmount(e.currentTarget.value);
            }}
            className="transfer-funds__input"
          />
          <Button className="developer-configs_button" centered type="submit">
            Update price
          </Button>
        </form>
        <Button
          className="developer-configs_button admin-ledger_button"
          secondary
          centered
          type="submit"
        >
          View Admin Ledger
        </Button>
        <p className="admin-note">
          {' '}
          Note: visit the admin page to simulate Transfer events.
        </p>
        {props.numOfItems > 0 && (
          <div className="dev-configs-bottom-buttons-container">
            <Button
              className="initiate-payment_button"
              centered
              type="button"
              onClick={initiateTransfer}
            >
              Initiate month {numberOfPayments + 1} payment
            </Button>
            <Button
              className="developer-configs_button"
              centered
              secondary
              type="button"
            >
              Remove bank account {amt}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
TransferForm.displayName = 'TransferForm';
export default TransferForm;
