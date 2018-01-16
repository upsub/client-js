export default class Channel {
  /**
   * Create a new Channel instance
   * @param {Array} channels
   * @param {Client} client
   * @return {Channel}
   */
  constructor (channels, client) {
    this._client = client
    this._channels = channels
  }

  /**
   * Register channel and listen for messages
   * @param  {String|Function} channel
   * @param  {Function|undefined} listener
   * @return {Channel}
   */
  on (channel, listener) {
    if (listener === undefined) {
      listener = channel
      channel = ''
    }

    for (const prefix of this._channels) {
      const chan = `${prefix}/${channel}`
      this._channels.push(`${prefix}/${channel}`)
      this._client.on(chan, listener)
    }

    return this
  }

  /**
   * Unregister channel and listeners
   * @param  {String} channel
   * @return {Channel}
   */
  off (channel) {
    for (const prefix of this._channels) {
      this._client.off(`${prefix}/${channel}`)
    }

    return this
  }

  /**
   * Send message on a channel
   * @param  {String} channel
   * @param  {Mixed} payload
   */
  send (channel, payload) {
    for (const prefix of this._channels) {
      this._client.send(`${prefix}/${channel}`, payload)
    }
  }

  /**
   * Unsubscribe from channel and remove all its event listeners
   * @return {[type]} [description]
   */
  unsubscribe () {
    this._client.unsubscribe(...this._channels)
  }
}
