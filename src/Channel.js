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
      const c = `${prefix}/${channel}`
      this._subscriptions.push(c)
      this._client.on(c, listener)
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
      this._subscriptions = this._subscriptions.filter(
        c => c !== `${prefix}/${channel}`
      )
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
   */
  unsubscribe () {
    this._client._unsubscribe(...this._subscriptions)
    this._subscriptions = []
  }

  /**
   * Get the channel subscriptions
   * @return {Array} of channels
   */
  get subscriptions () {
    return this._subscriptions
  }
}
