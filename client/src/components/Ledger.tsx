import React, { useState } from 'react';
import Button from 'plaid-threads/Button';

import { TransferType } from './types';
import {
  simulateTransferEvent,
  simulateSweep,
  fireTransferWebhook,
  getTransfersByUser,
} from '../services/api';

interface Props {
  transfers: TransferType[] | null;
  setIsLedgerView: (arg: boolean) => void;
  userId: number;
}

const Ledger: React.FC<Props> = (props: Props) => {
  const [transfers, setTransfers] = useState<TransferType[] | null>(
    props.transfers
  );
  const simulateEvent = async (transferId: string, event: string) => {
    if (event === 'sweep') {
      await simulateSweep();
      await fireTransferWebhook();
    } else {
      await simulateTransferEvent(transferId, event);
      await fireTransferWebhook();
    }
  };

  const updateLedger = async () => {
    const newTransfers = await getTransfersByUser(props.userId);
    setTransfers(newTransfers.data);
  };

  const tableRows =
    transfers == null
      ? null
      : transfers.map((transfer, index) => {
          return (
            <div className="ledger_table_row" key={index}>
              {' '}
              <div className=" ledger_table_data ledger1">
                {/* last 5 digits of transfer_id */}
                {transfer.transfer_id.slice(transfer.transfer_id.length - 4)}
              </div>
              <div className=" ledger_table_data ledger2">
                ${transfer.amount.toFixed(2)}
              </div>
              <div className=" ledger_table_data ledger3">
                {transfer.status}
              </div>
              <div className=" ledger_table_data ledger3">
                {transfer.sweep_status}
              </div>
              <div className="ledger4">
                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button btn1"
                  onClick={() => simulateEvent(transfer.transfer_id, 'posted')}
                >
                  {' '}
                  Simulate posted
                </Button>

                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button"
                  onClick={() => simulateEvent(transfer.transfer_id, 'failed')}
                >
                  Simulate fail
                </Button>
                <Button
                  secondary
                  centered
                  inline
                  className="simulate_button"
                  onClick={() =>
                    simulateEvent(transfer.transfer_id, 'reversed')
                  }
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
      <Button
        secondary
        centered
        inline
        className="simulate_button sweep"
        onClick={() => simulateEvent('none', 'sweep')}
      >
        {' '}
        Simulate sweep
      </Button>
      <Button
        secondary
        centered
        inline
        className="simulate_button sweep"
        onClick={updateLedger}
      >
        {' '}
        Update Ledger
      </Button>
      <div className="ledger_table">
        <div className="ledger_table_row">
          <div className="transfers_table_header ledger1">ID</div>
          <div className="transfers_table_header ledger2">Amount</div>
          <div className="transfers_table_header ledger3">Status</div>
          <div className="transfers_table_header ledger3">Sweep</div>
          <div className="transfers_table_header ledger4">Actions</div>
        </div>
        {tableRows}
      </div>
    </div>
  );
};

Ledger.displayName = 'Ledger';
export default Ledger;
