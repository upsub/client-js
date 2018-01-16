/* eslint-env jest */
import Client from 'Client'

let client = null

beforeEach(() => {
  client = new Client('ws://localhost:5000', {
    appID: 'testing',
    public: 'public',
    secret: 'secret',
    name: 'dev'
  })

  client.on('connect', () => {
    const myChannel = client.subscribe('my-channel', 'hello')
    myChannel.unsubscribe()
    console.log(myChannel._channels, client.subscriptions)
  })
})

afterEach(() => {
  client.close()
})

test('test', done => {
  setTimeout(done, 1000)
})
