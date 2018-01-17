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

test('Should set options', () => {
  expect(client1._options).toMatchSnapshot()
  expect(client2._options).toMatchSnapshot()
})

test('Should send ping message and receive pong', done => {
  client1.on('pong', done)
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

test('Should unregister channel and listener', done => {
  server.expect(['subscribe', 'unsubscribe'], () => {
    expect(Object.keys(client1._events).includes('some-channel')).toBe(false)
    expect(client1.subscriptions.includes('some-channel')).toBe(false)
    done()
  })
  client1.on('some-channel', () => {})
  client1.off('some-channel')
})

// test('Should subscribe to channel', () => {
//   client1.subscribe('my-channel')
//   expect(client1.subscriptions.includes('my-channel')).toBe(true)
// })
//
// test('Should unsubscribe from channel', () => {
//   client1.subscribe('my-channel')
//   client1.unsubscribe('my-channel')
//   expect(client1.subscriptions.includes('my-channel')).toBe(false)
// })

test('Should send a text message', done => {
  client2.on('some-channel', msg => {
    expect(msg).toBe('message')
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
