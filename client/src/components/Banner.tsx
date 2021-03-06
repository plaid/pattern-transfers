import React from 'react';
import Button from 'plaid-threads/Button';
interface Props {
  initialSubheading?: boolean;
  username?: string | null;
  isLedgerView: boolean;
  setIsLedgerView?: (arg: boolean) => void;
  userId?: number;
}

const Banner: React.FC<Props> = (props: Props) => {
  const normalTitle = 'PlatyFlix';

  const ledgerTitle = 'PlatyFlix Admin';

  const title = props.isLedgerView ? ledgerTitle : normalTitle;

  const initialText =
    'This is an example transfers app that outlines an end-to-end integration with Plaid.';

  const successText = 'Link a bank account and view your payment history.';

  const ledgerText =
    'This page demonstrates one way to visualize your Transfer ledger for your internal tools.';

  const subheadingText = props.isLedgerView
    ? ledgerText
    : props.initialSubheading
    ? initialText
    : successText;

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
    </div>
  );
};

Banner.displayName = 'Banner';
export default Banner;
