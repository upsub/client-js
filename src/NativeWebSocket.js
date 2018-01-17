/**
 * Wrap the native Websocket implementation for browsers into a ws module
 * api structure. The ws module is replaced with this implementation
 * on build time.
 */
/* global WebSocket */
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
   * Get current connection state
   * @return {Number}
   */
  get readyState () {
    return this._connection.readyState
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
    this._connection = this._connect()
    this._listen()
  }

  /**
   * Create a new WebSocket Connection
   * @return {WebSocket}
   */
  _connect () {
    return new WebSocket(this._host, this._subprotocol)
  }

  /**
   * Listen for websocket events
   * @return {[type]} [description]
   */
  _listen () {
    this._connection.onopen = event => this.emit('open', event)
    this._connection.onmessage = event => this.emit('message', event.data)
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
