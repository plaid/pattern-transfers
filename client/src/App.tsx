import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import { UserPage, Landing, Sockets, OAuthLink, UserList } from './components';
import { AccountsProvider } from './services/accounts';
import { InstitutionsProvider } from './services/institutions';
import { ItemsProvider } from './services/items';
import { LinkProvider } from './services/link';
import { TransfersProvider } from './services/transfers';

import { UsersProvider } from './services/users';
import { CurrentUserProvider } from './services/currentUser';
import { ErrorsProvider } from './services/errors';
import { PaymentsProvider } from './services/payments';
import { AppStatusProvider } from './services/appStatus';

import './App.scss';

function App() {
  toast.configure({
    autoClose: 8000,
    draggable: false,
    toastClassName: 'box toast__background',
    bodyClassName: 'toast__body',
    hideProgressBar: true,
  });

  return (
    <div className="App">
      <AppStatusProvider>
        <InstitutionsProvider>
          <ItemsProvider>
            <TransfersProvider>
              <PaymentsProvider>
                <LinkProvider>
                  <AccountsProvider>
                    <ErrorsProvider>
                      <UsersProvider>
                        <CurrentUserProvider>
                          <Sockets />
                          <Switch>
                            <Route exact path="/" component={Landing} />
                            <Route path="/user/:userId" component={UserPage} />
                            <Route path="/oauth-link" component={OAuthLink} />
                            <Route path="/userlist" component={UserList} />
                          </Switch>
                        </CurrentUserProvider>
                      </UsersProvider>
                    </ErrorsProvider>
                  </AccountsProvider>
                </LinkProvider>
              </PaymentsProvider>
            </TransfersProvider>
          </ItemsProvider>
        </InstitutionsProvider>
      </AppStatusProvider>
    </div>
  );
}

export default withRouter(App);
