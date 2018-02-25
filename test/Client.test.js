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
    pingInterval: 5000
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

test('Should send ping message and receive pong', done => {
  client1.on('pong', () => done())
  client1.ping()
})

test('Should register channel with listener', done => {
  server.expect(['subscribe'], () => {
    expect(Object.keys(client1._events).includes('some-channel')).toBe(true)
    expect(client1.subscriptions.includes('some-channel')).toBe(true)
    done()
  })
  client1.on('some-channel', () => {})
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

test('Should unregister remove specific listener', () => {
  const listener = () => {}
  client1.on('channel', () => {})
  client1.on('channel', listener)
  client1.off('channel', listener)
  expect(client1._events['channel'].length).toBe(1)
  expect(client1._subscriptions.includes('channel')).toBe(true)
})

test('Should unsubscribe from channel', () => {
  client1.on('my-channel', () => {})
  client1.unsubscribe('my-channel')
  expect(client1.subscriptions.includes('my-channel')).toBe(false)
  expect(Object.keys(client1._events).includes('my-channel')).toBe(false)
})

test('Should send and receive a text message', done => {
  client2.on('some-channel', (payload, msg) => {
    expect(payload).toBe('message')
    expect(msg).toMatchSnapshot()
    done()
  })
  client1.send('some-channel', 'message')
})

test('Should close connection', done => {
  client1.on('disconnect', () => {
    expect(client1.isClosed).toBe(true)
    done()
  })
  client1.close()
  expect(client1.isClosing).toBe(true)
})

test('Should export subscriptions', () => {
  client1.on('test', () => {})
  expect(client1.subscriptions).toEqual(['test'])
})

test('Should have isConnecting, isConnected, isClosing, isClosed flags', () => {
  expect(client1.isConnecting).toBe(false)
  expect(client1.isConnected).toBe(true)
  expect(client1.isClosing).toBe(false)
  expect(client1.isClosed).toBe(false)
})
