import React, { useEffect, useState } from 'react';
import Callout from 'plaid-threads/Callout';
import { Institution } from 'plaid/dist/api';

import { useItems, useLink, useInstitutions } from '../services';
import { UserType, ItemType, PaymentType } from './types';

interface Props {
  user: UserType;
  removeButton: boolean;
  linkButton: boolean;
  userId: number;
  accountName: string;
  item: ItemType | null;
  payments: PaymentType | null;
}

const Item: React.FC<Props> = (props: Props) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const { institutionsById, getInstitutionById } = useInstitutions();

  const plaid_institution_id =
    props.item != null ? props.item.plaid_institution_id : null;
  const monthlyPayment =
    props.payments != null ? props.payments.monthly_payment : 0;

  useEffect(() => {
    if (plaid_institution_id != null) {
      setInstitution(institutionsById[plaid_institution_id] || {});
    }
  }, [institutionsById, plaid_institution_id]);

  useEffect(() => {
    if (plaid_institution_id != null) {
      getInstitutionById(plaid_institution_id);
    }
  }, [getInstitutionById, plaid_institution_id]);

  return (
    <div className="box item-container">
      <div className="item-info">
        <div>
          <h3 className="heading">Bank name</h3>
          {institution != null && <p className="value">{institution.name}</p>}
        </div>
        <div>
          <h3 className="heading">Account type</h3>
          <p className="value">{props.accountName}</p>
        </div>
        <div>
          <h3 className="heading">Recurring payment</h3>
          <p className="subscription-amount">
            ${monthlyPayment.toFixed(2).toString()}
          </p>
        </div>
      </div>
    </div>
  );
};

Item.displayName = 'Item';
export default Item;
