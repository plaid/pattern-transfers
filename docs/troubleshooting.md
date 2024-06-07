# Troubleshooting

View the logs with the following Docker command:

```shell
make logs
```

If you're experiencing oddities in the app, here are some common problems and their possible solutions.

## Common Issues

## My simulation buttons are not working

For webhooks to work, the server must be publicly accessible on the internet. For development purposes, this application uses [ngrok][ngrok-readme] to accomplish that. The ngrok webhook addresses are only valid for 2 hours. If you are not receiving webhooks in this sample application, restart your server to reset the ngrok webhook address.

## Still need help?

Please head to the [Help Center](https://support.plaid.com/hc/en-us) or [get in touch](https://dashboard.plaid.com/support/new) with Support.
