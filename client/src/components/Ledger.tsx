import React, { useEffect } from 'react';
import Button from 'plaid-threads/Button';
import { toast } from 'react-toastify';

import { TransferType, AppStatusType } from './types';
import {
  simulateTransferEvent,
  simulateSweep,
  fireTransferWebhook,
} from '../services/api';
import { useUsers, useCurrentUser } from '../services';

interface Props {
  transfers: TransferType[] | null;
  setIsLedgerView: (arg: boolean) => void;
  userId: number;
  appStatus: AppStatusType | null;
}

const Ledger: React.FC<Props> = (props: Props) => {
  const { usersById } = useUsers();
  const { setCurrentUser } = useCurrentUser();
  const simulateEvent = async (transferId: string, event: string) => {
    if (event === 'sweep') {
      try {
        await simulateSweep();
        await fireTransferWebhook();
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        const eventResponse = await simulateTransferEvent(transferId, event);
        console.log(eventResponse);
        await fireTransferWebhook();
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          toast.error(err.message);
        }
      }
    }
    await fireTransferWebhook();
  };
  const user = usersById[props.userId];
  useEffect(() => {
    if (user.username != null) {
      setCurrentUser(user.username);
    }
  }, [setCurrentUser, user]);

  const account_balance =
    props.appStatus != null ? props.appStatus.app_account_balance : 0;
  const tableRows =
    props.transfers == null
      ? null
      : props.transfers.map((transfer, index) => {
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
      <div className="ledger-header">
        <h4>PlatyFlix Transfer Ledger</h4>
        <h4>
          PlatyFlix Business Checking Account balance:{' '}
          <span>${account_balance.toFixed(2)}</span>
        </h4>
      </div>
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
