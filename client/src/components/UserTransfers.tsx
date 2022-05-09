import React from 'react';

import { TransferType } from './types';
interface Props {
  transfers: TransferType[] | null;
}

const UserTransfers: React.FC<Props> = (props: Props) => {
  const tableRows =
    props.transfers == null
      ? null
      : props.transfers.map((transfer, index) => {
          return (
            <div key={index} className="transfers-table__row">
              {' '}
              <div className=" transfers-table__data column1">{index + 1}</div>
              <div className=" transfers-table__data column2">
                {transfer.status}
              </div>
              <div className=" transfers-table__data column3">
                ${transfer.amount.toFixed(2)}
              </div>
            </div>
          );
        });

  return (
    <div>
      {' '}
      <h4>Payment History</h4>
      <div className="transfers-table">
        <div className="transfers-table__row">
          <div className="transfers-table__header column1">Month</div>
          <div className="transfers-table__header column2">Status</div>
          <div className="transfers-table__header column3">Amount</div>
        </div>
        {tableRows}
      </div>
    </div>
  );
};

UserTransfers.displayName = 'UserTransfers';
export default UserTransfers;
