import WebSocket from 'ws'

export default port => {
  const server = new WebSocket.Server({ port: 3999 })

  server.expect = (msgs = [], callback) => {
    server.expects = msgs
    server.onSuccess = callback
  }

  server.onSuccess = () => {}
  server.expects = []

  server.received = []

  server.on('connection', ws => {
    ws.on('message', message => {
      server.emit('received')
      const decoded = JSON.parse(message)
      if (decoded.payload) {
        decoded.payload = JSON.parse(decoded.payload)
      }

      server.received.push(decoded)
      let received = true

      for (const msg of server.received) {
        if (!server.expects.includes(msg.headers['upsub-message-type'])) {
          received = false
        }
      }

      if (received) {
        server.onSuccess()
      }

      if (decoded.headers['upsub-message-type'] === 'ping') {
        ws.send(JSON.stringify({ headers: { 'upsub-message-type': 'pong' } }))
        return
      }

      server.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })
  })

  server.on('error', () => {})

  return server
}
