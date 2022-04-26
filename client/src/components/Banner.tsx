import React from 'react';
import Button from 'plaid-threads/Button';
import ChevronS2Left from 'plaid-threads/Icons/ChevronS2Left';

import { TransferType } from './types';
import { getTransfersByUser } from '../services/api';

interface Props {
  initialSubheading?: boolean;
  username?: string | null;
  isLedgerView: boolean;
  setIsLedgerView?: (arg: boolean) => void;
  userId?: number;
  setTransfers?: (transfers: TransferType[]) => void;
}

const Banner: React.FC<Props> = (props: Props) => {
  const normalTitle = 'PlatyFlix';

  const ledgerTitle = 'PlatyFlix Admin';

  const title = props.isLedgerView ? ledgerTitle : normalTitle;

  const initialText =
    'This is an example transfers app that outlines an end-to-end integration with Plaid.';

  const successText =
    "This page shows a user's payment settings page and allows them to link a bank account with Plaid to complete their subscription payments";

  const ledgerText =
    'This page demonstrates one way to visualize your Transfer ledger for your internal tools.';

  const subheadingText = props.isLedgerView
    ? ledgerText
    : props.initialSubheading
    ? initialText
    : successText;

  const returnToPayments = async () => {
    console.log(props);
    if (props.userId != null && props.setTransfers != null) {
      const transfers = await getTransfersByUser(props.userId);
      console.log(transfers.data);
      await props.setTransfers(transfers.data);
    }

    if (props.setIsLedgerView != null) {
      props.setIsLedgerView(false);
    }
  };

  return (
    <div id="banner" className="bottom-border-content">
      {!props.initialSubheading && <h4>username: {props.username} </h4>}
      <div className="header">
        <h1 className="everpresent-content__heading">{title}</h1>
        <Button
          href="https://docs.google.com/forms/d/e/1FAIpQLSfF4Xev5w9RPGr7fNkSHjmtE_dj0ELuHRbDexQ7Tg2xoo6tQg/viewform"
          target="_blank"
          rel="noopener noreferrer"
          inline
          centered
          secondary
        >
          Provide feedback on this Plaid Pattern sample app
        </Button>
      </div>
      <p id="intro" className="everpresent-content__subheading">
        {subheadingText}
      </p>
      {props.isLedgerView && (
        <div className="return-to-payments">
          <ChevronS2Left className="chevron" />
          <Button tertiary onClick={returnToPayments}>
            Return to payments page
          </Button>
        </div>
      )}
    </div>
  );
};

Banner.displayName = 'Banner';
export default Banner;
