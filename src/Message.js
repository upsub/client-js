export default class Message {
  /**
   * Create a new message instance
   * @param {String} type
   * @param {String} channel
   * @param {Object} headers
   * @param {Mixed} payload
   */
  constructor (type, channel, headers = {}, payload) {
    this._type = type
    this._channel = channel
    this.headers = headers
    this.payload = payload
  }

  /**
   * Get header upsub-message-type and return its value
   * @return {String}
   */
  get type () {
    return this._type
  }

  /**
   * Get header upsub-message-type and return its value
   * @return {String}
   */
  get channel () {
    return this._channel
  }

  /**
   * Encode message so its ready to be send
   * @return {String}
   */
  encode () {
    let msg = `${this._type} ${this._channel || ''}`.trim()
    let payload = this.payload

    for (const key in this.headers) {
      msg += `\n${key}: ${this.headers[key]}`
    }

    if (payload) {
      msg += '\n\n'
    }

    if (this._type === Message.JSON) {
      payload = JSON.stringify(this.payload)
    }

    msg += payload || ''

    return msg
  }

  /**
   * Message representation in string format
   * @return {String}
   */
  toString () {
    return this.encode()
  }

  /**
   * Decode message and create Message object from it
   * @param  {String} message
   * @return {Message}
   */
  static decode (message) {
    const [head, body = ''] = message.split(/\n\s*\n/)
    const msg = new Message()

    for (const header of head.split('\n')) {
      if (!msg.type && !msg.channel) {
        const [type, channel = ''] = header.split(' ')
        msg._type = type
        msg._channel = channel
        continue
      }

      const [key, value = ''] = header.split(':')
      msg.headers[key] = value.trim()
    }

    if (msg.type === Message.JSON) {
      msg.payload = JSON.parse(body)
    } else {
      msg.payload = body
    }

    return msg
  }

  /**
   * Create a new bacth message
   * @param  {Message} messages which should be send together
   * @return {Message}
   */
  static batch (...messages) {
    return new Message(Message.BATCH, '', {}, messages)
  }

  /**
   * Create a new ping message
   * @return {Message}
   */
  static ping () {
    return new Message(Message.PING)
  }

  /**
   * Create a new pong message
   * @return {Message}
   */
  static pong () {
    return new Message(Message.PONG)
  }

  /**
   * Create a new text message
   * @param  {String} channel
   * @param  {Mixed} payload
   * @return {Message}
   */
  static text (channel, payload) {
    if (typeof payload !== 'string') {
      return Message.json(channel, payload)
    }

    return new Message(Message.TEXT, channel, {}, payload)
  }

  /**
   * Create a new text message
   * @param  {String} channel
   * @param  {Mixed} payload
   * @return {Message}
   */
  static json (channel, payload) {
    return new Message(Message.JSON, channel, {}, payload)
  }

  /**
   * Create a new subscribe message
   * @param  {String} channels
   * @return {Message}
   */
  static subscribe (...channels) {
    return new Message(Message.SUBSCRIBE, '', {}, channels.join(','))
  }

  /**
   * Create a new unsubscribe message
   * @param  {String} channels
   * @return {Message}
   */
  static unsubscribe (...channels) {
    return new Message(Message.UNSUBSCRIBE, '', {}, channels.join(','))
  }

  /**
   * Message type TEXT
   */
  static get TEXT () {
    return 'text'
  }

  /**
   * Message type TEXT
   */
  static get JSON () {
    return 'json'
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
