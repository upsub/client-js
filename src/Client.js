import WebSocket from 'ws'
import Channel from './Channel'
import Message from './message'
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
   * @param {Object} deps
   * @return {Client}
   */
  constructor (host, options = {}, deps = {}) {
    super()
    this._host = host
    this._subscriptions = []
    this._state = CLOSED
    this._connection = null
    this._connectionAttemps = 0
    this._setDefaultOptions(options)
    this._connect()
  }

  /**
   * Create the internal options object from the given object
   * @param {Object} options
   */
  _setDefaultOptions (options) {
    this._options = {}
    this._options.name = options.name
    this._options.appID = options.appID
    this._options.public = options.public
    this._options.secret = options.secret
    this._options.subprotocol = options.subprotocol
    this._options.reconnectionAttemps = options.reconnectionAttemps
    this._options.reconnectionDelay = options.reconnectionDelay || 2000
    this._options.pingInterval = options.pingInterval || 30000
  }

  /**
   * Establish a new connection to the websocket server
   */
  _connect () {
    this._connection = new WebSocket(
      this._host + this._createQueryString()
    )
    this._connectionAttemps++
    this._listen()
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
      ['upsub-connection-name', this._options.name]
    ]

    const createQuery = (keys, [key, value]) => (
      value ? keys.concat(`${key}=${value}`) : keys
    )

    return `?${query.reduce(createQuery, []).join('&')}`
  }

  /**
   * Listen for WebSocket messages
   */
  _listen () {
    this._connection.on('open', this._onOpen.bind(this))
    this._connection.on('message', this._onMessage.bind(this))
    this._connection.on('close', this._onClose.bind(this))
    this._connection.on('error', this._onError.bind(this))
    this.on('error', () => {})
  }

  /**
   * Handle WebSocket open event
   * @param  {Object} event
   */
  _onOpen (event) {
    this.emit('connect', event)
  }

  /**
   * Handle WebSocket message event
   * @param  {Object} event
   */
  _onMessage (event) {
    const message = Message.decode(event)

    if (message.type === Message.PONG) {
      this.emit('pong')
      return
    }

    if (message.type === Message.PING) {
      this.emit('ping')
      this._sendMessage(Message.pong())
      return
    }

    this.emit(message.headers['upsub-channel'], message.payload)
  }

  /**
   * Handle WebSocket close event
   * @param  {Object} event
   */
  _onClose (event) {
    this.emit('disconnect', event)
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
    if (this._events[channel]) {
      this._events[channel].push(listener)
    } else {
      this._events[channel] = [listener]
    }

    if (
      !this._subscriptions.includes(channel) &&
      !RESERVED_CHANNELS.includes(channel)
    ) {
      this._subscribe(channel)
    }

    return this
  }

  /**
   * Unregister channel and send unsubscribe event
   * @param  {String} channel
   * @return {Client}
   */
  off (channel) {
    if (this._events[channel]) {
      delete this._events[channel]
      this._unsubscribe(channel)
    }

    return this
  }

  /**
   * Subscribe to channels
   * @param  {String} channels
   */
  _subscribe (...channels) {
    this._sendMessage(Message.subscribe(...channels))
    this._subscriptions = this._subscriptions.concat(channels)
  }

  /**
   * unsubscribe to channels
   * @param  {String} channels
   */
  _unsubscribe (...channels) {
    if (channels.length === 0) {
      this.unsubscribe(...this.subscriptions)
      return
    }

    for (const channel of channels) {
      this.off(channel)
    }

    this._sendMessage(Message.unsubscribe(...channels))
    this._subscriptions = this._subscriptions.filter(
      sub => !channels.find(chan => chan === sub)
    )
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
    this._sendMessage(Message.text(channel, payload))
  }

  /**
   * Close connection to the WebSocket server
   * @param  {Number} code
   * @param  {String} reason
   */
  close (code, reason) {
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
