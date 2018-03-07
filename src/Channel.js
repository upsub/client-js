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
    this._subscriptions = []
  }

  /**
   * Register channel and listen for messages
   * @param  {String} channel
   * @param  {Function} listener
   * @return {Channel}
   */
  on (channel, listener) {
    for (const prefix of this._channels) {
      this._client.on(`${prefix}/${channel}`, listener)
    }

    if (!this._subscriptions.includes(channel)) {
      this._subscriptions.push(channel)
    }

    return this
  }

  /**
   * Unregister channel and listeners
   * @param  {String} channel
   * @param  {Function} listener
   * @return {Channel}
   */
  off (channel, listener) {
    for (const prefix of this._channels) {
      this._subscriptions = this._subscriptions.filter(
        c => c !== channel
      )
      this._client.off(`${prefix}/${channel}`, listener)
    }

    if (this._subscriptions.includes(channel)) {
      this.unsubscribe(channel)
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
   * Send a new request
   * @param  {String} channel
   * @param  {Mixed} payload
   * @return {Promise}         [description]
   */
  request (channel, payload) {
    if (this._channels.length > 1) {
      throw new Error('Can only send request on a single channel at once')
    }

    return this._client.request(`${this._channels[0]}/${channel}`, payload)
  }

  /**
   * Unsubscribe from channels and remove all its listeners
   * @param {String} channels
   */
  unsubscribe (...channels) {
    if (this._subscriptions.length === 0) {
      return
    }

    if (channels.length === 0) {
      this.unsubscribe(...this._subscriptions)
      return
    }

    this._subscriptions = this._subscriptions.filter(
      sub => !channels.find(chan => chan === sub)
    )

    this._client.unsubscribe(...channels.reduce((channels, channel) => {
      for (const prefix of this._channels) {
        channels.push(`${prefix}/${channel}`)
      }

      return channels
    }, []))
  }

  /**
   * Get the channel subscriptions
   * @return {Array} of channels
   */
  get subscriptions () {
    return this._subscriptions
  }
}
