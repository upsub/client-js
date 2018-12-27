import WebSocket from 'ws'
import Channel from './Channel'
import Message from './Message'
import EventEmitter from 'events'

/**
 * WebSocket States
 */
const CONNECTING = 0
const CONNECTED = 1
const CLOSING = 2
const CLOSED = 3
const RESERVED_CHANNELS = ['connect', 'disconnect', 'error', 'subscribe', 'unsubscribe']

export default class Client extends EventEmitter {
  /**
   * Create a new Client instance
   * @param {String} host
   * @param {Object} options
   * @return {Client}
   */
  constructor (host, options = {}) {
    super()
    this._host = host
    this._subscriptions = []
    this._connection = null
    this._connectionAttemps = 0
    this._pingInterval = null
    this._pongTimeout = null
    this._reconnectionInterval = null
    this._protocol = '1.0'
    this._setDefaultOptions(options)
    this._connect()
  }

  /**
   * Create the internal options object from the given object
   * @param {Object} options
   */
  _setDefaultOptions (options) {
    const valid = name => {
      if (name && name.includes(' ')) {
        throw new Error('The connection name can not contain spaces')
      }

      return name
    }

    this._options = {}
    this._options.name = valid(options.name)
    this._options.appID = options.appID
    this._options.public = options.public
    this._options.secret = options.secret
    this._options.reconnectionDelay = options.reconnectionDelay || 2000
    this._options.pingInterval = options.pingInterval || 30000
    this._options.pongTimeout = options.pongTimeout || 5000
    this._options.requestTimeout = options.requestTimeout || 5000
    this._options.subscriptionTimeout = options.subscriptionTimeout || 2000
  }

  /**
   * Establish a new connection to the websocket server
   */
  _connect () {
    if (this._reconnectionInterval) {
      this._reconnectionInterval = clearInterval(this._reconnectionInterval)
    }

    if (this._connection && this.isConnected) {
      return
    }

    this._connection = new WebSocket(
      this._host + this._createQueryString()
    )

    this._connectionAttemps++
    this._listen()
  }

  /**
   * Reconnect to the WebSocket server
   */
  _reconnect (forced = true) {
    if (forced && this.isConnected) {
      this.close()
    }

    if (this._reconnectionInterval) {
      return
    }

    this._clearPingInterval()
    this._reconnectionInterval = setInterval(
      () => this._connect(),
      this._options.reconnectionDelay
    )
  }

  /**
   * Create query string with upsub options
   * @return {String}
   */
  _createQueryString () {
    const query = [
      ['upsub-app-id', this._options.appID],
      ['upsub-public', this._options.public],
      ['upsub-secret', this._options.secret],
      ['upsub-connection-name', this._options.name],
      ['upsub-protocol', this._protocol]
    ]

    const createQuery = (keys, [key, value]) => (
      value ? keys.concat(`${key}=${encodeURIComponent(value)}`) : keys
    )

    return `?${query.reduce(createQuery, []).join('&')}`
  }

  /**
   * Start the ping interval and pong timeout
   */
  _startPingInterval () {
    const setPongTimeout = () => {
      this._pongTimeout = setTimeout(
        () => this._reconnect(),
        this._options.pongTimeout
      )
    }

    this._pingInterval = setInterval(
      () => {
        this.ping()
        setPongTimeout()
      },
      this._options.pingInterval
    )
  }

  /**
   * Clear ping interval and pong timeout
   */
  _clearPingInterval () {
    if (this._pingInterval) {
      this._pingInterval = clearInterval(this._pingInterval)
      this._pongTimeout = clearTimeout(this._pongTimeout)
    }
  }

  /**
   * Listen for WebSocket messages
   */
  _listen () {
    this._connection.on('open', this._onOpen.bind(this))
    this._connection.on('message', this._onMessage.bind(this))
    this._connection.on('close', this._onClose.bind(this))
    this._connection.on('error', this._onError.bind(this))

    if (!this._events.error) {
      this.on('error', () => this._reconnect())
    }
  }

  /**
   * Handle WebSocket open event
   * @param  {Object} event
   */
  _onOpen (event) {
    this.emit('connect', event)
    this._startPingInterval()
    this._subscribe(...this._subscriptions)
  }

  /**
   * Handle WebSocket message event
   * @param  {Object} event
   */
  _onMessage (event) {
    const message = Message.decode(event)

    if (message.type === Message.PONG) {
      this._pongTimeout = clearTimeout(this._pongTimeout)
      this.emit('pong')
      return
    }

    if (message.type === Message.PING) {
      this._sendMessage(Message.pong())
      return
    }

    if (!message.channel) {
      return
    }

    const reply = payload => {
      if (!message.headers['upsub-response-channel']) {
        console.warn('Can only reply on request messages')
      }

      this.send(message.headers['upsub-response-channel'], payload)
    }

    for (const channel of message.channel.split(',')) {
      this.emit(channel, message.payload, message, reply)
    }
  }

  /**
   * Handle WebSocket close event
   * @param  {Object} event
   */
  _onClose (event) {
    this.emit('disconnect', event)

    if (this.isClosed) {
      return
    }

    this._reconnect()
  }

  /**
   * Handle WebSocket error event
   * @param  {Object} event
   */
  _onError (event) {
    this.emit('error', event)
  }

  /**
   * Send message to the server
   * @param  {Message} message
   */
  _sendMessage (message) {
    if (!this.isConnected) {
      return
    }

    this._connection.send(message.encode())
  }

  /**
   * Send a ping message to the server
   */
  ping () {
    this._sendMessage(Message.ping())
  }

  /**
   * Register channel and listen for messages
   * @param  {String} channel
   * @param  {Function} listener
   * @return {Client}
   */
  on (channel, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Second argument should be a function')
    }

    if (channel.includes(' ')) {
      throw new Error(`Channel can't include spaces`)
    }

    if (this._events[channel]) {
      this._events[channel].push(listener)
    } else {
      this._events[channel] = [listener]
    }

    if (
      !this._subscriptions.includes(channel) &&
      !RESERVED_CHANNELS.includes(channel) &&
      !channel.includes(':')
    ) {
      this._subscribe(channel)
    }

    return this
  }

  /**
   * Unregister channel and send unsubscribe event
   * @param  {String} channel
   * @param  {Function} listener
   * @return {Client}
   */
  off (channel, listener) {
    if (listener && typeof listener !== 'function') {
      throw new TypeError('Second argument should be a function')
    }

    if (!this._events[channel]) {
      return this
    }

    if (listener && this._events[channel].length > 1) {
      this._events[channel] = this._events[channel].filter(l => l !== listener)
    } else {
      delete this._events[channel]
    }

    if (
      this._subscriptions.includes(channel) &&
      !this._events[channel] &&
      !channel.includes(':')
    ) {
      this.unsubscribe(channel)
    }

    return this
  }

  /**
   * Subscribe to channels
   * @param  {String} channels
   */
  _subscribe (...channels) {
    if (channels.length === 0) {
      return
    }

    this._sendMessage(Message.subscribe(...channels))

    for (const channel of channels) {
      let listener
      let timeout = setTimeout(
        () => this._subscribe(channel),
        this._options.subscriptionTimeout
      )

      listener = () => {
        timeout = clearTimeout(timeout)
        if (!this._subscriptions.includes(channel)) {
          this._subscriptions.push(channel)
        }
        this.off(channel + ':subscribed', listener)
      }

      this.on(channel + ':subscribed', listener)

      if (this._subscriptions.includes(channel)) {
        continue
      }
    }
  }

  /**
   * unsubscribe to channels
   * @param  {String} channels
   */
  unsubscribe (...channels) {
    if (this._subscriptions.length === 0) {
      return
    }

    if (channels.length === 0) {
      this.unsubscribe(...this._subscriptions)
      return
    }

    for (const channel of channels) {
      let listener
      let timeout = setTimeout(
        () => this.unsubscribe(channel),
        this._options.subscriptionTimeout
      )

      listener = () => {
        timeout = clearTimeout(timeout)
        this._subscriptions = this._subscriptions.filter(c => c !== channel)
        this.off(channel + ':unsubscribed', listener)
      }

      this.on(channel + ':unsubscribed', listener)

      if (this._events[channel]) {
        this.off(channel)
      }
    }

    this._sendMessage(Message.unsubscribe(...channels))
  }

  /**
   * Should create a new channel
   * @param  {String} channels
   * @return {Channel}
   */
  channel (...channels) {
    return new Channel(channels, this)
  }

  /**
   * Send message on specific channel to the server
   * @param  {String} channel
   * @param  {Mixed} payload
   */
  send (channel, payload) {
    this._sendMessage(
      typeof payload !== 'string'
        ? Message.json(channel, payload)
        : Message.text(channel, payload)
    )
  }

  /**
   * Send a request message
   * @param  {String} channel
   * @param  {Mixed} payload
   * @return {Promise}
   */
  request (channel, payload) {
    const msg = Message.text(channel, payload)
    const responseChannel = msg.channel + '/response-' + Math.random().toString(36).substr(2, 9)
    msg.headers['upsub-response-channel'] = responseChannel

    return new Promise((resolve, reject) => {
      let timeout

      // Start timeout when the the dispatcher subscribes to the response
      this.on(responseChannel + ':subscribed', () => {
        timeout = setTimeout(
          () => reject(new Error(`Request timeout, didn't receive response from client`)),
          this._options.requestTimeout
        )

        this._sendMessage(msg)
      })

      // listen for response
      this.on(responseChannel, payload => {
        this.off(responseChannel + ':subscribed')
        this.off(responseChannel)
        resolve(payload)
        timeout = clearTimeout(timeout)
      })
    })
  }

  /**
   * Close connection to the WebSocket server
   * @param  {Number} code
   * @param  {String} reason
   */
  close (code, reason) {
    this._clearPingInterval()
    this._connection.close(code, reason)
  }

  /**
   * Check if the client is connecting
   * @return {Boolean}
   */
  get isConnecting () {
    return this._connection.readyState === CONNECTING
  }

  /**
   * Check if the client is connected
   * @return {Boolean}
   */
  get isConnected () {
    return this._connection.readyState === CONNECTED
  }

  /**
   * Check if the client is closing
   * @return {Boolean}
   */
  get isClosing () {
    return this._connection.readyState === CLOSING
  }

  /**
   * Check if the client is closed
   * @return {Boolean}
   */
  get isClosed () {
    return this._connection.readyState === CLOSED
  }

  /**
   * List with the client subscriptions
   * @return {Array} of subscriptions
   */
  get subscriptions () {
    return this._subscriptions
  }
}
