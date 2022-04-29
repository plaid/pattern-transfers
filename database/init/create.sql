-- This trigger updates the value in the updated_at column. It is used in the tables below to log
-- when a row was last updated.

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- USERS
-- This table is used to store the users of our application. The view returns the same data as the
-- table, we're just creating it to follow the pattern used in other tables.

CREATE TABLE users_table
(
  id SERIAL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER users_updated_at_timestamp
BEFORE UPDATE ON users_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW users
AS
  SELECT
    id,
    username,
    created_at,
    updated_at
  FROM
    users_table;


-- ITEMS
-- This table is used to store the items associated with each user. The view returns the same data
-- as the table, we're just using both to maintain consistency with our other tables. For more info
-- on the Plaid Item schema, see the docs page: https://plaid.com/docs/#item-schema

CREATE TABLE items_table
(
  id SERIAL PRIMARY KEY,
  user_id integer REFERENCES users_table(id) ON DELETE CASCADE,
  plaid_access_token text UNIQUE NOT NULL,
  plaid_item_id text UNIQUE NOT NULL,
  plaid_institution_id text NOT NULL,
  status text NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER items_updated_at_timestamp
BEFORE UPDATE ON items_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW items
AS
  SELECT
    id,
    plaid_item_id,
    user_id,
    plaid_access_token,
    plaid_institution_id,
    status,
    created_at,
    updated_at
  FROM
    items_table;


-- ACCOUNTS
-- This table is used to store the accounts associated with each item. The view returns all the
-- data from the accounts table and some data from the items view. For more info on the Plaid
-- Accounts schema, see the docs page:  https://plaid.com/docs/#account-schema

CREATE TABLE accounts_table
(
  id SERIAL PRIMARY KEY,
  item_id integer REFERENCES items_table(id) ON DELETE CASCADE,
  user_id integer,
  plaid_item_id text UNIQUE NOT NULL,
  plaid_account_id text UNIQUE NOT NULL,
  name text NOT NULL,
  subtype text NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER accounts_updated_at_timestamp
BEFORE UPDATE ON accounts_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW accounts
AS
  SELECT
    id,
    plaid_account_id,
    item_id,
    plaid_item_id,
    user_id,
    name,
    subtype,
    created_at,
    updated_at
  FROM
    accounts_table;


-- TRANSFERS
-- This table is used to store the transfers associated with each item.  The view returns the same data
-- as the table, we're just using both to maintain consistency with our other tables. For more info on the Plaid
-- Transfers schema, see the docs page:  https://plaid.com/docs/products/transfer/#transfercreate

CREATE TABLE transfers_table
(
  id SERIAL PRIMARY KEY,
  item_id integer REFERENCES items_table(id) ON DELETE CASCADE,
  user_id integer,
  plaid_account_id text,
  transfer_intent_id text,
  authorization_id text,
  transfer_id text,
  amount numeric,
  status text,
  type text,
  sweep_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER transfers_updated_at_timestamp
BEFORE UPDATE ON transfers_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW transfers
AS
  SELECT
    id,
    plaid_account_id,
    item_id,
    user_id,
    transfer_intent_id,
    authorization_id,
    transfer_id,
    amount,
    status,
    type,
    sweep_status,
    created_at,
    updated_at
  FROM
    transfers_table;

-- APP_STATUS
-- This table is used to store the status of our application. The view returns the same data as the
-- table, we're just creating it to follow the pattern used in other tables.

CREATE TABLE app_status_table
(
  id SERIAL PRIMARY KEY,
  number_of_events integer,
  app_account_balance numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER app_status_updated_at_timestamp
BEFORE UPDATE ON app_status_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW app_status
AS
  SELECT
    id,
    number_of_events,
    app_account_balance,
    created_at,
    updated_at
  FROM
    app_status_table;

    -- TRANSFER EVENTS
-- This table is used to store the events associated with each transfer.  The view returns the same data
-- as the table, we're just using both to maintain consistency with our other tables. For more info on the Plaid
-- Events schema, see the docs page:  https://plaid.com/docs/products/transfer/#transfereventsync

CREATE TABLE transfer_events_table
(
  id SERIAL PRIMARY KEY,
  plaid_event_id integer UNIQUE,
  user_id integer REFERENCES users_table(id) ON DELETE CASCADE,
  plaid_account_id text,
  transfer_type text,
  event_type text,
  transfer_id text,
  amount numeric,
  sweep_amount numeric,
  failure_reason text,
  sweep_id text,
  timestamp text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER transfer_events_updated_at_timestamp
BEFORE UPDATE ON transfer_events_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW transfer_events
AS
  SELECT
    id,
    plaid_event_id,
    user_id,
    plaid_account_id,
    transfer_type,
    event_type,
    transfer_id,
    amount,
    sweep_amount,
    failure_reason,
    sweep_id,
    timestamp,
    created_at,
    updated_at
  FROM
    transfer_events_table;

-- Payments
-- This table is used to store the payments associated with each user.  The view returns the same data
-- as the table; we're just using both to maintain consistency with our other tables.

CREATE TABLE payments_table
(
  id SERIAL PRIMARY KEY,
  user_id integer REFERENCES users_table(id) ON DELETE CASCADE,
  payments_total numeric,
  monthly_payment numeric,
  number_of_payments numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER payments_updated_at_timestamp
BEFORE UPDATE ON payments_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW payments
AS
  SELECT
    id,
    user_id,
    payments_total,
    monthly_payment,
    number_of_payments,
    created_at,
    updated_at
  FROM
    payments_table;



-- The link_events_table is used to log responses from the Plaid API for client requests to the
-- Plaid Link client. This information is useful for troubleshooting.

CREATE TABLE link_events_table
(
  id SERIAL PRIMARY KEY,
  type text NOT NULL,
  user_id integer,
  link_session_id text,
  request_id text,
  error_type text,
  error_code text,
  status text,
  created_at timestamptz default now()
);


-- The plaid_api_events_table is used to log responses from the Plaid API for server requests to
-- the Plaid client. This information is useful for troubleshooting.

CREATE TABLE plaid_api_events_table
(
  id SERIAL PRIMARY KEY,
  item_id integer,
  user_id integer,
  plaid_method text NOT NULL,
  arguments text,
  request_id text UNIQUE,
  error_type text,
  error_code text,
  created_at timestamptz default now()
);
