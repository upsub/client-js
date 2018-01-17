/* eslint-env jest */
import ClientES from 'Client'
const ClientCJS = require('Client')

test('Should export the Client', () => {
  expect(ClientES).toMatchSnapshot()
  expect(ClientCJS).toMatchSnapshot()
})
