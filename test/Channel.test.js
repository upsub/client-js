/* eslint-env jest */
import Client from 'Client'
import Channel from 'Channel'
import wss from './util/server'

let client, channel, server, receiver

beforeEach(done => {
  server = wss(3999)
  client = new Client('ws://localhost:3999')
  receiver = new Client('ws://localhost:3999')

  client.on('connect', () => {
    channel = client.channel('channel')
    done()
  })
})

afterEach(done => {
  client.close()
  server.close(() => done())
})

test('Should create a new channel', done => {
  const channel = new Channel(['channel-1', 'channel-2'], client)
  expect(channel._channels).toEqual(['channel-1', 'channel-2'])
  expect(channel._client).toBe(client)
  done()
})

test('Should register channel with listener', done => {
  let listener = () => {
    expect(channel.subscriptions.includes('test')).toBe(true)
    expect(client.subscriptions.includes('channel/test')).toBe(true)
    expect(Object.keys(client._events).includes('channel/test')).toBe(true)
    done()
  }
  channel.on('test', () => {})
  channel.on('test:subscribed', () => {
    listener()
    channel.off('test:subscribed')
  })
})

test('Should unregister channel and listener', done => {
  server.expect(['subscribe', 'unsubscribe'], () => {
    expect(channel.subscriptions.includes('channel/test')).toBe(false)
    expect(client.subscriptions.includes('channel/test')).toBe(false)
    expect(Object.keys(client._events).includes('channel/test')).toBe(false)
    done()
  })
  channel.on('test', () => {})
  channel.off('test')
})

test('Should send a message on the channel', done => {
  receiver.on('channel/test', msg => {
    expect(msg).toBe('data')
    done()
  })
  channel.send('test', 'data')
})

test('Should unsubscribe channel subscriptions', done => {
  client.on('test', () => {})
  channel.on('test', () => {})
  channel.on('test:subscribed', () => {
    channel.unsubscribe()
    channel.on('test:unsubscribed', () => {
      channel.off('test:unsubscribed')
      expect(channel.subscriptions).toEqual([])
      expect(client.subscriptions).toEqual(['test'])
      expect(Object.keys(client._events).includes('channel/test')).toBe(false)
      done()
    })
  })
})
