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

})

afterEach(() => {
  client.close()
})

test('test', done => {
  setTimeout(done, 1000)
})
