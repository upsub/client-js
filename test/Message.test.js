/* eslint-env jest */
import Message from 'Message'

test('Should create a new message', () => {
  const msg = new Message(
    Message.TEXT,
    'channel',
    { 'header-key': 'value' },
    { key: 'value' }
  )
  expect(msg).toMatchSnapshot()
})

test('msg.type should return specified message type', () => {
  const msg = new Message(Message.TEXT)
  expect(msg.type).toBe('text')
})

test('Should encode message to string format', () => {
  const msg = new Message(
    Message.TEXT,
    'channel',
    { 'header-key': 'header-value' },
    'payload'
  )
  expect(msg.encode()).toMatchSnapshot()
  expect(msg.toString()).toEqual(msg.encode())
})

test('Should parse a string and create a new message', () => {
  const msg = Message.decode(`text channel\n\npayload`)

  expect(msg).toMatchSnapshot()
})

test('Should create a batch message', () => {
  const msg = Message.batch(new Message('text', 'channel'))
  expect(msg).toMatchSnapshot()
})

test('Should create a ping message', () => {
  const msg = Message.ping()
  expect(msg).toMatchSnapshot()
})

test('Should create a pong message', () => {
  const msg = Message.pong()
  expect(msg).toMatchSnapshot()
})

test('Should create a text message', () => {
  const msg = Message.text('channel', 'data')
  expect(msg).toMatchSnapshot()
})

test('Should create a subscribe message', () => {
  const msg = Message.subscribe('channel')
  const msg2 = Message.subscribe('channel', 'channel-2')
  expect(msg).toMatchSnapshot()
  expect(msg2).toMatchSnapshot()
})

test('Should create an unsubscribe message', () => {
  const msg = Message.unsubscribe('channel')
  const msg2 = Message.unsubscribe('channel', 'channel-2')
  expect(msg).toMatchSnapshot()
  expect(msg2).toMatchSnapshot()
})

test('Should export message types', () => {
  expect(Message.TEXT).toBe('text')
  expect(Message.BATCH).toBe('batch')
  expect(Message.SUBSCRIBE).toBe('subscribe')
  expect(Message.UNSUBSCRIBE).toBe('unsubscribe')
  expect(Message.PING).toBe('ping')
  expect(Message.PONG).toBe('pong')
})
