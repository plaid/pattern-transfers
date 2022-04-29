# Plaid Pattern Transfer

![Plaid Pattern client][client-img]

This is a sample Transfer application demonstrating an end-to-end [Plaid][plaid] integration, focused on using the transfer endpoint to transfer funds.

The full Plaid Pattern collection of sample apps includes:

[Plaid Pattern Personal Finance Manager](https://github.com/plaid/pattern/) - Demonstrates the Plaid Transactions API

[Plaid Pattern Account Funding App](https://github.com/plaid/pattern-account-funding) - Demonstrates the Plaid Auth, Balance, and Identity APIs

[Plaid Pattern Transfer App](https://github.com/plaid/pattern-transfers) - Demonstrates the Transfer API

Plaid Pattern apps are provided for illustrative purposes and are not meant to be run as production applications.

## Requirements

-   [Docker][docker] Version 2.0.0.3 (31259) or higher, installed, running, and signed in. If you're on **Windows**, check out [this link][wsl] to get set up in WSL.
-   [Plaid API keys][plaid-keys] - [sign up][plaid-signup] for a free Sandbox account if you don't already have one

## Getting Started

Note: We recommend running these commands in a unix terminal. Windows users can use a [WSL][wsl] terminal to access libraries like `make`.

1. Clone the repo.
    ```shell
    git clone https://github.com/plaid/pattern-transfers.git
    cd pattern
    ```
1. Create the `.env` file.
    ```shell
    cp .env.template .env
    ```
1. Update the `.env` file with your [Plaid API keys][plaid-keys] and OAuth redirect uri (in sandbox this is 'http<span>://localhost:3002/oauth-link'</span>) and link customization name.

1. Follow the instructions for [Transfer UI](https://plaid.com/docs/transfer/using-transfer-ui/#prerequisites-for-using-transfer-ui) to set up your link customization on the [Plaid developer dashboard](https://dashboard.plaid.com/team/api).

1. You will also need to configure an allowed redirect URI for your client ID through the [Plaid developer dashboard](https://dashboard.plaid.com/team/api).

1. Finally, contact your Plaid Account Executive or Account Manager to make sure that your clientId is enabled for the Transfer product.

1. Start the services. The first run may take a few minutes as Docker images are pulled/built for the first time.
    ```shell
    make start
    ```
1. Open http://localhost:3002 in a web browser.
1. View the logs
    ```shell
    make logs
    ```
1. When you're finished, stop the services.
    ```shell
    make stop
    ```

## Additional Commands

All available commands can be seen by calling `make help`.

## Architecture

As a modern full-stack application, Pattern consists of multiple services handling different segments of the stack:

-   [`client`][client-readme] runs a [React]-based single-page web frontend
-   [`server`][server-readme] runs an application back-end server using [NodeJS] and [Express]
-   [`database`][database-readme] runs a [PostgreSQL][postgres] database
-   [`ngrok`][ngrok-readme] exposes a [ngrok] tunnel from your local machine to the Internet to receive webhooks

We use [Docker Compose][docker-compose] to orchestrate these services. As such, each individual service has its own Dockerfile, which Docker Compose reads when bringing up the services.

More information about the individual services is given below.

# Plaid Pattern - Client

The Pattern web client is written in JavaScript using [React]. It presents the [Transfer UI][transfer-ui] workflow to the user, including an implementation of [OAuth][plaid-oauth]. The app runs on port 3002 by default, although you can modify this in [docker-compose.yml](../docker-compose.yml). It includes an administration ledger view where you can simulate different transfer events.

## Key concepts

### Communicating with the server

Aside from websocket listeners (see below), all HTTP calls to the Pattern server are defined in `src/services/api.js`.

### Webhooks and Websockets

The Pattern server is configured to send a message over a websocket whenever it receives a webhook from Plaid. On the client side websocket listeners are defined in `src/components/Sockets.jsx` that wait for these messages and update data in real time accordingly.

The TRANSFER_EVENTS_UPDATE webhook is demonstrated in this sample app in the [transfer webhook handler][transfers-handler].

### Admin

A view of all users is provided to developers on `http://localhost:3002/userlist`. Developers have the ability to remove a user here.

# Plaid Pattern - Server

The application server is written in JavaScript using [Node.js][nodejs] and [Express][expressjs]. It interacts with the Plaid API via the [Plaid Node SDK][plaid-node], and with the [database][database-readme] using [`node-postgres`][node-pg]. While we've used Node for the reference implementation, the concepts shown here will apply no matter what language your backend is written in.

## Key Concepts

### Using transfers events webhook.

Plaid uses [webhooks][transfers-webhooks] to notify you whenever a new transfer event has occured. This sample app demonstrates the use of the sandbox transfer fire_webhook endpoint to test this webhook. For an example of this, see the [transfer webhook handler][transfers-handler]. Upon receipt of this webhook, a call will be made to the transfer [event sync endpoint](https://plaid.com/docs/api/products/transfer/#transfereventsync) to request the latest transfer events. For each event, the transfer get endpooint is called in order to get the current status of the transfer, and then the event is saved to the database.

For webhooks to work, the server must be publicly accessible on the internet. For development purposes, this application uses [ngrok][ngrok-readme] to accomplish that. The ngrok session is only valid for 2 hours and the server must be re-started after that.

### Testing OAuth

A redirect_uri parameter is included in the linkTokenCreate call and set in this sample app to the PLAID_SANDBOX_REDIRECT_URI you have set in the .env file (`http://localhost:3002/oauth-link`). This is the page that the user will be redirected to upon completion of the OAuth flow at their OAuth institution. You will also need to configure `http://localhost:3002/oauth-link` as an allowed redirect URI for your client ID through the [Plaid developer dashboard](https://dashboard.plaid.com/team/api).

To test the OAuth flow in sandbox, choose 'Playtypus OAuth Bank' from the list of financial institutions in Plaid Link.

If you want to test OAuth in development, you need to use https and set `PLAID_REDIRECT_URI=https://localhost:3002/oauth-link` in `.env`. In order to run your localhost on https, you will need to create a self-signed certificate and add it to the client root folder. MacOS users can use the following instructions to do this. Note that self-signed certificates should be used for testing purposes only, never for actual deployments. Windows users can use [these instructions below](#windows-instructions-for-using-https-with-localhost).

#### MacOS instructions for using https with localhost

If you are using MacOS, in your terminal, change to the client folder:

```bash
cd client
```

Use homebrew to install mkcert:

```bash
brew install mkcert
```

Then create your certificate for localhost:

```bash
mkcert -install
mkcert localhost
```

This will create a certificate file localhost.pem and a key file localhost-key.pem inside your client folder.

Then in the package.json file in the client folder, replace this line on line 26

```bash
"start": "PORT=3002 react-scripts start",
```

with this line instead:

```bash
"start": "PORT=3002 HTTPS=true SSL_CRT_FILE=localhost.pem SSL_KEY_FILE=localhost-key.pem react-scripts start",
```

Finally, in the wait-for-client.sh file in the server folder, replace this line on line 6

```bash
while [ "$(curl -s -o /dev/null -w "%{http_code}" -m 1 localhost:3002)" != "200" ]
```

with this line instead:

```bash
while [ "$(curl -s -o /dev/null -w "%{http_code}" -m 1 https://localhost:3002)" != "200" ]
```

After starting up the Pattern sample app, you can now view it at https://localhost:3002.

#### Windows instructions for using https with localhost

If you are on a Windows machine, in the package.json file in the client folder, replace this line on line 26

```bash
"start": "PORT=3002 react-scripts start",
```

with this line instead:

```bash
"start": "PORT=3002 HTTPS=true react-scripts start",
```

Then, in the wait-for-client.sh file in the server folder, replace this line on line 6

```bash
while [ "$(curl -s -o /dev/null -w "%{http_code}" -m 1 localhost:3002)" != "200" ]
```

with this line instead:

```bash
while [ "$(curl -s -o /dev/null -w "%{http_code}" -m 1 https://localhost:3002)" != "200" ]
```

After starting up the Pattern sample app, you can now view it at https://localhost:3002. Your browser will alert you with an invalid certificate warning; click on "advanced" and proceed.

## Initial App Status and database

For purposes of this sample app only, an initial call to transfer/event/sync is made when the app is loaded. This is because in order to call transfer/event/sync later you will need the event_id of the very last event created on your clientId to set as the after_id in the request. In the case that you have cleared your database before starting the server, you will no longer have a database of events in order to obtain that last event_id. The initial call to transfer/event/sync will paginate through the events to find the very last event created and saves this event_id in the database to use in the transfer/event/sync call in response to the first webhook received. For subsequent webhooks, calls made to transfer/event/sync can use the event_id of the very last event in the database.

## Debugging

The node debugging port (9229) is exposed locally on port 9229.

If you are using Visual Studio Code as your editor, you can use the `Docker: Attach to Server` launch configuration to interactively debug the server while it's running. See the [VS Code docs][vscode-debugging] for more information.

# Plaid Pattern - Database

The database is a [PostgreSQL][postgres] instance running inside a Docker container.

Port 5432 is exposed to the Docker host, so you can connect to the DB using the tool of your choice.
Username and password can be found in [docker-compose.yml][docker-compose].

## Key Concepts

### Plaid API & Link Identifiers

API and Link Identifiers are crucial for maintaining a scalable and stable integration.
Occasionally, an Institution error may occur due to a bank issue, or a live product pull may fail on request.
To resolve these types of issues, Plaid Identifiers are required to [open a Support ticket in the Dashboard][plaid-new-support-ticket].

`access_tokens` and `item_ids` are the core identifiers that map end-users to their financial institutions.
As such, we are storing them in the database associated with our application users.
**These identifiers should never be exposed client-side.**

Plaid returns a unique `request_id` in all server-side responses and Link callbacks.
A `link_session_id` is also returned in Link callbacks.
These values can be used for identifying the specific network request or Link session for a user, and associating that request or session with other events in your application.
We store these identifiers in database tables used for logging Plaid API requests, as they can be useful for troubleshooting.

For more information, see the docs page on [storing Plaid API identifiers][plaid-docs-api-identifiers].

## Tables

The `*.sql` scripts in the `init` directory are used to initialize the database if the data directory is empty (i.e. on first run, after manually clearing the db by running `make clear-db`, or after modifying the scripts in the `init` directory).

See the [create.sql][create-script] initialization script to see some brief notes for and the schemas of the tables used in this application.
While most of them are fairly self-explanitory, we've added some additional notes for some of the tables below.

### link_events_table

This table stores responses from the Plaid API for client requests to the Plaid Link client.

User flows that this table captures (based on the client implementation, which hooks into the `onExit` and `onSuccess` Link callbacks):

-   User opens Link, closes without trying to connect an account.
    This will have type `exit` but no request_id, error_type, or error_code.
-   User tries to connect an account, fails, and closes link.
    This will have type `exit` and will have a request_id, error_type, and error_code.
-   User successfully connects an account.
    This will have type `success` but no request_id, error_type, or error_code.

### plaid_api_events_table

This table stores responses from the Plaid API for server requests to the Plaid client.
The server stores the responses for all of the requests it makes to the Plaid API.
Where applicable, it also maps the response to an item and user.
If the request returned an error, the error_type and error_code columns will be populated.

## Learn More

-   [PostgreSQL documentation][postgres-docs]

# Plaid Pattern - ngrok

This demo includes [ngrok](https://ngrok.com/), a utility that creates a secure tunnel between your local machine and the outside world. We're using it here to expose the local webhooks endpoint to the internet.

Browse to [localhost:4040](http://localhost:4040/inspect/http) to see the ngrok dashboard. This will show any traffic that gets routed through the ngrok URL.

**Do NOT use ngrok in production!** It's only included here as a convenience for local development and is not meant to be a production-quality solution.

Don’t want to use ngrok? As long as you serve the app with an endpoint that is publicly exposed, all the Plaid webhooks will work.

ngrok's free account has a session limit of 2 hours. To fully test out some of the transaction webhook workflows, you will need to get a more persistent endpoint as noted above when using the development environment.

## Source

This image is a copy of the Docker Hub image [wernight/ngrok](https://hub.docker.com/r/wernight/ngrok/dockerfile). We've copied it here to allow us to more closely version it and to make changes as needed.

## Learn More

-   https://hub.docker.com/r/wernight/ngrok/dockerfile
-   https://github.com/wernight/docker-ngrok/tree/202c4692cbf1bbfd5059b6ac56bece42e90bfb82

## Troubleshooting

See [`docs/troubleshooting.md`][troubleshooting].

## Additional Resources

-   For an overview of the Plaid platform and products, refer to this [Quickstart guide][plaid-quickstart].
-   Check out this [introduction to Transfer](https://plaid.com/docs/transfer/).
-   Find comprehensive information on Plaid API endpoints in the [API documentation][plaid-docs].
-   Questions? Please head to the [Help Center][plaid-help] or [open a Support ticket][plaid-support-ticket].

## License

Plaid Pattern is a demo app that is intended to be used only for the purpose of demonstrating how you can integrate with Plaid. You are solely responsible for ensuring the correctness, legality, security, privacy, and compliance of your own app and Plaid integration. The Pattern code is licensed under the [MIT License](LICENSE) and is provided as-is and without warranty of any kind. Plaid Pattern is provided for demonstration purposes only and is not intended for use in production environments.

[create-script]: database/init/create.sql
[docker-compose]: ./docker-compose.yml
[plaid-docs-api-identifiers]: https://plaid.com/docs/#storing-plaid-api-identifiers
[plaid-new-support-ticket]: https://dashboard.plaid.com/support/new
[postgres]: https://www.postgresql.org/
[postgres-docs]: https://www.postgresql.org/docs/
[cra]: https://github.com/facebook/create-react-app
[plaid-link]: https://plaid.com/docs/#integrating-with-link
[plaid-oauth]: https://plaid.com/docs/link/oauth/#introduction-to-oauth
[plaid-link-update-mode]: https://plaid.com/docs/link/update-mode/
[react]: https://reactjs.org/
[database-readme]: #plaid-pattern---database
[expressjs]: http://expressjs.com/
[items-routes]: server/routes/items.js
[ngrok-readme]: #plaid-pattern---ngrok
[node-pg]: https://github.com/brianc/node-postgres
[nodejs]: https://nodejs.org/en/
[plaid-node]: https://github.com/plaid/plaid-node
[items-handler]: /server/webhookHandlers/handleItemWebhook.js
[transfers-handler]: /server/webhookHandlers/handleTransferWebhook.js
[error-webhooks]: https://plaid.com/docs/api/webhooks/#item-error
[transfer-webhooks]: https://plaid.com/docs/transfer/webhooks/
[users-routes]: /server/routes/users.js
[vscode-debugging]: https://code.visualstudio.com/docs/editor/debugging
[client-img]: docs/transfer_screenshot.jpg
[client-readme]: #plaid-pattern---client
[docker]: https://docs.docker.com/
[docker-compose]: https://docs.docker.com/compose/
[express]: https://expressjs.com/
[ngrok]: https://ngrok.com/
[nodejs]: https://nodejs.org/en/
[plaid]: https://plaid.com
[plaid-dashboard]: https://dashboard.plaid.com/team/api
[plaid-docs]: https://plaid.com/docs/
[plaid-help]: https://support.plaid.com/hc/en-us
[plaid-keys]: https://dashboard.plaid.com/account/keys
[plaid-quickstart]: https://plaid.com/docs/quickstart/
[plaid-signup]: https://dashboard.plaid.com/signup
[plaid-support-ticket]: https://dashboard.plaid.com/support/new
[plaid-redirect-uri]: https://plaid.com/docs/link/oauth/#redirect-uri-configuration
[postgres]: https://www.postgresql.org/
[transfer-ui]: https://plaid.com/docs/transfer/using-transfer-ui/
[react]: http://reactjs.org/
[server-readme]: #plaid-pattern---server
[troubleshooting]: docs/troubleshooting.md
[wsl]: https://nickjanetakis.com/blog/setting-up-docker-for-windows-and-wsl-to-work-flawlessly
