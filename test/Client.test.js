/* eslint-env jest */
import Client from 'Client'
import wss from './util/server'

let client1, client2, server

beforeEach(done => {
  server = wss(3999)
  client1 = new Client('ws://localhost:3999')
  client2 = new Client('ws://localhost:3999', {
    appID: 'app-id',
    public: 'public',
    secret: 'secret',
    subprotocol: 'subprotocol',
    reconnectionAttemps: 10,
    reconnectionDelay: 3000,
    pingInterval: 5000,
    subscriptionTimeout: 3000,
    requestTimeout: 2000
  })

  client1.on('connect', () => {
    done()
  })
})

afterEach(done => {
  client1.close()
  client2.close()
  server.close(() => done())
})

test('Should set options', done => {
  expect(client1._options).toMatchSnapshot()
  expect(client2._options).toMatchSnapshot()
  done()
})

test('Should throw if connection name contains spaces', () => {
  expect(() => new Client('', { name: 'hello world' })).toThrowErrorMatchingSnapshot()
})

test('Should send ping message and receive pong', done => {
  client1.on('pong', () => done())
  client1.ping()
})

test('Should register channel with listener', done => {
  client1.on('some-channel', () => {})
  client1.on('some-channel:subscribed', () => {
    client1.off('some-channel:subscribed')
    expect(Object.keys(client1._events).includes('some-channel')).toBe(true)
    expect(client1.subscriptions.includes('some-channel')).toBe(true)
    done()
  })
})

test('Should not send subscription to server if listener is containing an action', done => {
  server.expect(['text'], () => {
    done()
  })
  client1.on('channel:action', () => {})
  client1.send('message', 'test')
})

test(`Should throw error if .on second argument isn't a function`, () => {
  expect(() => client1.on('test', 'not a function...')).toThrowErrorMatchingSnapshot()
})

test('Should unregister channel and listeners', done => {
  server.expect(['subscribe', 'unsubscribe'], () => {
    expect(Object.keys(client1._events).includes('some-channel')).toBe(false)
    expect(client1.subscriptions.includes('some-channel')).toBe(false)
    done()
  })
  client1.on('some-channel', () => {})
  client1.off('some-channel')
})

test('Should remove specific listener', done => {
  const listener = () => {}
  client1.on('channel', () => {})
  client1.on('channel', listener)
  client1.on('channel:subscribed', () => {
    client1.off('channel:subscribed')
    client1.off('channel', listener)
    expect(client1._events['channel'].length).toBe(1)
    expect(client1._subscriptions.includes('channel')).toBe(true)
    done()
  })
})

test('Should unsubscribe from channel', done => {
  client1.on('my-channel', () => {})
  client1.on('my-channel:subscribed', () => {
    client1.unsubscribe('my-channel')
    client1.on('my-channel:unsubscribed', () => {
      expect(client1.subscriptions.includes('my-channel')).toBe(false)
      expect(Object.keys(client1._events).includes('my-channel')).toBe(false)
      done()
    })
  })
})

test('Should send and receive a text message', done => {
  client2.on('some-channel', (payload, msg) => {
    expect(payload).toBe('message')
    expect(msg).toMatchSnapshot()
    done()
  })
  client2.on('some-channel:subscribed', () => {
    client1.send('some-channel', 'message')
  })
})

test('Should close connection', done => {
  client1.on('disconnect', () => {
    expect(client1.isClosed).toBe(true)
    done()
  })
  client1.close()
  expect(client1.isClosing).toBe(true)
})

test('Should export subscriptions', done => {
  client1.on('test', () => {})
  client1.on('test:subscribed', () => {
    expect(client1.subscriptions).toEqual(['test'])
    done()
  })
})

test('Should create a request and subscribe for a response', done => {
  client2.on('channel/event', (payload, msg, reply) => reply('response data...'))
  client1.request('channel/event', 'data')
    .then(res => {
      setTimeout(() => {
        expect(client1.subscriptions).toMatchSnapshot()
        expect(client1._events).toMatchSnapshot()
        expect(res).toBe('response data...')
        done()
      }, 100)
    })
})

test('Should throw error if request times out', done => {
  client1._options.requestTimeout = 100
  client1.request('channel', 'data')
    .catch(err => {
      expect(err).toMatchSnapshot()
      done()
    })
})

test('Should throw error if channel includes spaces', () => {
  expect(() => {
    client1.on('should fail', () => {})
  }).toThrowErrorMatchingSnapshot()
})

test('Should have isConnecting, isConnected, isClosing, isClosed flags', () => {
  expect(client1.isConnecting).toBe(false)
  expect(client1.isConnected).toBe(true)
  expect(client1.isClosing).toBe(false)
  expect(client1.isClosed).toBe(false)
})
