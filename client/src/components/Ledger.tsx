import React, { useEffect } from 'react';
import Button from 'plaid-threads/Button';
import ChevronS2Left from 'plaid-threads/Icons/ChevronS2Left';
import { toast } from 'react-toastify';

import { TransferType, AppStatusType, StatusType } from './types';
import {
  simulateTransferEvent,
  simulateSweep,
  fireTransferWebhook,
  getTransfersByUserId,
} from '../services/api';
import { useUsers, useCurrentUser } from '../services';

interface Props {
  transfers: TransferType[] | null;
  setIsLedgerView: (arg: boolean) => void;
  userId: number;
  appStatus: AppStatusType | null;
  setTransfers?: (transfers: TransferType[]) => void;
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
        await simulateTransferEvent(transferId, event);
        await fireTransferWebhook();
      } catch (err) {
        if (err instanceof Error) {
          console.log('error response', err);
          toast.error(err.message);
        }
      }
    }
  };
  const user = usersById[props.userId];
  useEffect(() => {
    if (user.username != null) {
      setCurrentUser(user.username);
    }
  }, [setCurrentUser, user]);

  const returnToPayments = async () => {
    try {
      if (props.userId != null && props.setTransfers != null) {
        const transfers = await getTransfersByUserId(props.userId);
        await props.setTransfers(transfers.data);
      }

      if (props.setIsLedgerView != null) {
        props.setIsLedgerView(false);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const statusClassName: StatusType = {
    posted: 'posted',
    failed: 'failed',
    returned: 'returned',
    swept: 'swept',
    return_swept: 'return_swept',
  };

  const account_balance =
    props.appStatus != null ? props.appStatus.app_account_balance : 0;
  const tableRows =
    props.transfers == null
      ? null
      : props.transfers.map((transfer, index) => {
          return (
            <div className="ledger_table_row" key={index}>
              {' '}
              <div className=" ledger_table_data ledger1_data">{index + 1}</div>
              <div className=" ledger_table_data ledger2">
                ${transfer.amount.toFixed(2)}
              </div>
              <div className={statusClassName[transfer.status]}>
                {transfer.status}
              </div>
              <div className={statusClassName[transfer.sweep_status]}>
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
                    simulateEvent(transfer.transfer_id, 'returned')
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
          <div className="transfers_table_header ledger1">Month</div>
          <div className="transfers_table_header ledger2">Amount</div>
          <div className="transfers_table_header ledger3">Status</div>
          <div className="transfers_table_header ledger3">Sweep</div>
          <div className="transfers_table_header ledger4">Actions</div>
        </div>
        {tableRows}
      </div>
      <div className="return-to-payments">
        <ChevronS2Left className="chevron" />
        <Button tertiary onClick={returnToPayments}>
          Return to payments page
        </Button>
      </div>
    </div>
  );
};

Ledger.displayName = 'Ledger';
export default Ledger;
