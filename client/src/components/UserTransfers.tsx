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
              <div className=" transfers-table__data month ">{index + 1}</div>
              <div className=" transfers-table__data ">{transfer.status}</div>
              <div className=" transfers-table__data">
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
          <div className="transfers-table__header ">Month</div>
          <div className="transfers-table__header ">Status</div>
          <div className="transfers-table__header ">Amount</div>
        </div>
        {tableRows}
      </div>
    </div>
  );
};

UserTransfers.displayName = 'UserTransfers';
export default UserTransfers;
