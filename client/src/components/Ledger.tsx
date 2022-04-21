import React from 'react';
import Button from 'plaid-threads/Button';

import { TransferType } from './types';

interface Props {
  transfers: TransferType[] | null;
  setIsLedgerView: (arg: boolean) => void;
}

const Ledger: React.FC<Props> = (props: Props) => {
  const postPayment = (transfer_Id: string) => {
    console.log('posting:', transfer_Id);
  };
  const sweepPayment = (transfer_Id: string) => {
    console.log('sweeping:', transfer_Id);
  };
  const returnPayment = (transfer_Id: string) => {
    console.log('returning:', transfer_Id);
  };
  const tableRows =
    props.transfers == null
      ? null
      : props.transfers.map((transfer, index) => {
          return (
            <div className="ledger_table_row" key={index}>
              {' '}
              <div className=" ledger_table_data ledger1">{transfer.id}</div>
              <div className=" ledger_table_data ledger2">
                ${transfer.amount.toFixed(2)}
              </div>
              <div className=" ledger_table_data ledger3">
                {transfer.status}
              </div>
              <div className="ledger4">
                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button btn1"
                  onClick={() => postPayment(transfer.transfer_id)}
                >
                  {' '}
                  Simulate posted
                </Button>
                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button"
                  onClick={() => sweepPayment(transfer.transfer_id)}
                >
                  {' '}
                  Simulate sweep
                </Button>
                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button"
                  onClick={() => returnPayment(transfer.transfer_id)}
                >
                  Simulate return
                </Button>
              </div>
            </div>
          );
        });

  return (
    <div className="ledger-container">
      {' '}
      <h4>PlatyFlix Transfer Ledger</h4>
      <div className="ledger_table">
        <div className="ledger_table_row">
          <div className="transfers_table_header ledger1">ID</div>
          <div className="transfers_table_header ledger2">Amount</div>
          <div className="transfers_table_header ledger3">Status</div>
          <div className="transfers_table_header ledger4">Actions</div>
        </div>
        {tableRows}
      </div>
    </div>
  );
};

Ledger.displayName = 'Ledger';
export default Ledger;
