# JavaScript client

[![npm version](https://img.shields.io/npm/v/@upsub/client.svg)](https://www.npmjs.com/package/@upsub/client)
[![Build Status](https://travis-ci.org/upsub/client-js.svg?branch=master)](https://travis-ci.org/upsub/client-js)
[![gzip size](http://img.badgesize.io/https://unpkg.com/@upsub/client/dist/client.min.js?compression=gzip)](https://unpkg.com/@upsub/client/dist/client.min.js)

This is the JavaScript client for UpSub, its supports `node`, `browser` and `web worker` environments.

## Install
```sh
npm install --save @upsub/client
```

## Usage
```js
import Client from '@upsub/client'

const client = new Client('ws://localhost:4400', {
  // options
})
```
> Connects to the [dispatcher server](https://github.com/upsub/dispatcher).

#### Options
- `name: String`: Name connection, useful for debugging.
- `appID: String`: App identifier for the dispatcher authentication.
- `secret: String`: Secret key for authentication.
- `public: String`: Public key for authentication.
- `reconnectionDelay: Number`: Delay between client reconnection attemps, default `2000` ms.  
- `pingInterval: Number`: The client will fire a ping message to the dispatcher each interval, default `30000` ms (30s).
- `pongTimeout: Number`: The client should receive a pong message within the timeout, the client will try to reconnect otherwise.
- `subscriptionTimeout: Number`: If the dispatcher doesn't send a subscription acknowledgement back within the timeout `2000` ms default, then the client will notify the server again.
- `requestTimeout: Number`: Request should receive a response within the given time otherwise reject, default is `5000` ms.

#### Subscribe to channels
The best way to structure event streams is by scoping events to a specific or multiple channels.
```js
// Subscribe to a single channel
const channel = client.channel('some-channel')

// Subscribe to multiple channels
const multipleChannels = client.channel('channel-1', 'channel-2')
```
The `channel` method returns a channel object which events listeners can be
bound to.

#### Unsubscribe from channels
To unsubscribe from a channel, invoke the `unsubscribe` method on the channel object.
```js
// Removes all channels subscriptions
channel.unsubscribe()

// Remove a specific channel subscription
channel.unsubscribe('channel-1')

// Remove multiple specific channel subscription
channel.unsubscribe('channel-1', 'channel-2')
```
When a channel is unsubscribed, all bound event listeners will also be removed.

#### Listen for events
The event system is based on the default `EventEmitter` in node and follows
the same api with some additions.
```js
// Bind event listener to a channel
channel.on('some-event', function (msg) {
  console.log(msg)
})

// Bind event listener on the client
client.on('some-event', msg => console.log(msg))
```

#### Remove event listener
To remove event listeners, invoke the `off` method on a channel or the client instance.
```js
// Remove event listener from channel
channel.off('some-event')

// Remove event listener from client
client.off('some-event')
```

#### Send message
Send a message to the UpSub [Dispatcher](https://github.com/upsub/dispatcher).
```js
// Send message on channel
channel.send('some-event', { hello: 'world!' })

// Send message directly from the client instance
client.send('some-event', 'message')
```

#### Send request
Send a request message on a channel to another listening client, the receiving client
should send a response back or the sender will throw an Error.
```js
// Send request
client.request('channel', { key: 'value' })
  .then(res => console.log(res))
  .catch(err => console.log(err)) // Nobody sent a response back

// Send response back
client.on('channel', (payload, msg, reply) => {
  reply('Send some data back...')
})
```

#### Close connection
```js
client.close()
```

## License
Released under the [MIT License](https://github.com/upsub/client-js/blob/master/LICENSE)
