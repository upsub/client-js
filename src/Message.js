export default class Message {
  /**
   * Create a new message instance
   * @param {Object} headers
   * @param {Mixed} payload
   */
  constructor (headers = {}, payload) {
    this.headers = headers
    this.payload = payload
  }

  /**
   * Get header upsub-message-type and return its value
   * @return {String}
   */
  get type () {
    return this.headers['upsub-message-type']
  }

  /**
   * Set header upsub-message-type
   * @param  {String} value
   */
  set type (value) {
    this.headers['upsub-message-type'] = value
  }

  /**
   * Encode message so its ready to be send
   * @return {String}
   */
  encode () {
    return JSON.stringify({
      headers: this.headers,
      payload: JSON.stringify(this.payload)
    })
  }

  /**
   * Decode message and create Message object from it
   * @param  {String} message
   * @return {Message}
   */
  static decode (message) {
    const { headers, payload } = JSON.parse(message)
    return new Message(headers, payload)
  }

  /**
   * Create a new bacth message
   * @param  {Message} messages which should be send together
   * @return {Message}
   */
  static batch (...messages) {
    const headers = {
      'upsub-message-type': Message.BATCH
    }

    return new Message(headers, messages)
  }

  /**
   * Create a new ping message
   * @return {Message}
   */
  static ping () {
    const headers = {
      'upsub-message-type': Message.PING
    }

    return new Message(headers)
  }

  /**
   * Create a new pong message
   * @return {Message}
   */
  static pong () {
    const headers = {
      'upsub-message-type': Message.PONG
    }

    return new Message(headers)
  }

  /**
   * Create a new text message
   * @param  {String} channel
   * @param  {Mixed} payload
   * @return {Message}
   */
  static text (channel, payload) {
    const headers = {
      'upsub-message-type': Message.TEXT,
      'upsub-channel': channel
    }
    return new Message(headers, payload)
  }

  /**
   * Create a new subscribe message
   * @param  {String} channels
   * @return {Message}
   */
  static subscribe (...channels) {
    const headers = {
      'upsub-message-type': Message.SUBSCRIBE,
    }
    return new Message(headers, channels.join(','))
  }

  /**
   * Create a new unsubscribe message
   * @param  {String} channels
   * @return {Message}
   */
  static unsubscribe (...channels) {
    const headers = {
      'upsub-message-type': Message.UNSUBSCRIBE
    }

    return new Message(headers, channels.join(','))
  }

  /**
   * Message type TEXT
   */
  static get TEXT () {
    return 'text'
  }

  /**
   * Message type BATCH
   */
  static get BATCH () {
    return 'batch'
  }

  /**
   * Message type SUBSCRIBE
   */
  static get SUBSCRIBE () {
    return 'subscribe'
  }

  /**
   * Message type UNSUBSCRIBE
   */
  static get UNSUBSCRIBE () {
    return 'unsubscribe'
  }

  /**
   * Message type PING
   */
  static get PING () {
    return 'ping'
  }

  /**
   * Message type PONG
   */
  static get PONG () {
    return 'pong'
  }

}
