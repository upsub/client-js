/**
 * Wrap the native Websocket implementation for browsers into a FayeWebSocket
 * api structure. The FayeWebSocket module is replaced with this implementation
 * on build time.
 */
import EventEmitter from 'events'

export default class NativeWebSocket extends EventEmitter {
  /**
   * Flag used to check if the native implementation of the websocket is used
   * @return {Boolean}
   */
  get NATIVE () {
    return true
  }

  /**
   * Create a new NativeWebSocket
   * @param {String} host
   * @param {String} subprotocol
   * @param {Object} options
   * @return {NativeWebSocket}
   */
  constructor (host, subprotocol, options = {}) {
    super()
    this._host = host
    this._subprotocol = subprotocol
    this._options = options
    this._connection = this.connect()
    this._listen()
  }

  /**
   * Create a new WebSocket Connection
   * @return {WebSocket}
   */
  _connect () {
    return new window.WebSocket(this._host, this._subprotocol)
  }

  /**
   * Listen for websocket events
   * @return {[type]} [description]
   */
  _listen () {
    this._connection.onopen = event => this.emit('open', event)
    this._connection.onmessage = event => this.emit('message', event)
    this._connection.onclose = event => this.emit('close', event)
    this._connection.onerror = event => this.emit('error', event)
  }

  /**
   * Send a message to the native WebSocket connection
   * @param  {String} message
   */
  send (message) {
    this._connection.send(message)
  }

  /**
   * Close the WebSocket connection
   * @param {Number} code
   * @param {String} reason
   */
  close (code, reason) {
    this._connection.close(code, reason)
  }
}
