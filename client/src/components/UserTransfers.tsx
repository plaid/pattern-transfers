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
            <div className="transfers_table_row" key={index}>
              {' '}
              <div className=" transfers_table_data column1">{index + 1}</div>
              <div className=" transfers_table_data column2">
                {transfer.status}
              </div>
              <div className=" transfers_table_data column3">
                ${transfer.amount.toFixed(2)}
              </div>
            </div>
          );
        });

  return (
    <div>
      {' '}
      <h4>Payment History</h4>
      <div className="transfers_table">
        <div className="transfers_table_row">
          <div className="transfers_table_header column1">Month</div>
          <div className="transfers_table_header column2">Status</div>
          <div className="transfers_table_header column3">Amount</div>
        </div>
        {tableRows}
      </div>
    </div>
  );
};

UserTransfers.displayName = 'UserTransfers';
export default UserTransfers;
