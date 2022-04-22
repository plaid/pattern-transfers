import React from 'react';

import { TransferType, ItemType } from './types';
import { updateInitialTransfer } from '../util';

interface Props {
  transfers: TransferType[] | null;
  item: ItemType | null;
}

const UserTransfers: React.FC<Props> = (props: Props) => {
  const itemId = props.item != null ? props.item.id : 0;
  const tableRows =
    props.transfers == null
      ? null
      : props.transfers.map((transfer, index) => {
          console.log(transfer);
          // if (transfer.status === null && index === 0) {
          //   updateInitialTransfer(transfer.transfer_intent_id, itemId);
          // }
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
