import React, { useState } from 'react';

import { NumberInput } from 'plaid-threads/NumberInput';
import { Button } from 'plaid-threads/Button';
import { currencyFilter } from '../util';

interface Props {
  setSubscriptionAmount: (arg: string) => void;
}
const TransferForm: React.FC<Props> = (props: Props) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [value, setValue] = useState('');
  const handleSubmit = (e: any) => {
    e.preventDefault();
    props.setSubscriptionAmount(transferAmount);
    setValue(
      `$${Number(value)
        .toFixed(2)
        .toString()}`
    );
  };

  const amt =
    parseFloat(transferAmount) > 0
      ? currencyFilter(parseFloat(transferAmount))
      : '';
  return (
    <>
      <div className="box developer-configs">
        <h4 className="subheading">Developer Configs</h4>{' '}
        <form onSubmit={handleSubmit}>
          <NumberInput
            id="transferAmount"
            name="transfer amount"
            value={value}
            required
            placeholder={value}
            label="Subscription price"
            onChange={e => {
              setTransferAmount(e.currentTarget.value);
              setValue(e.currentTarget.value);
            }}
            className="transfer-funds__input"
          />
          <Button className="update-price_button" centered type="submit">
            Update price {amt}
          </Button>
        </form>
        <Button
          className="admin-ledger_button"
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
      </div>
    </>
  );
};
TransferForm.displayName = 'TransferForm';
export default TransferForm;
