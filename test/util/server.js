import WebSocket from 'ws'

function parse (message) {
  const [head, body] = message.split(/\n\s*\n/)
  const [type, channel = ''] = head.split('\n')[0].split(' ')
  const headers = {}

  for (const header of head.split('\n')) {
    const [key, value = ''] = header.split(':')
    headers[key] = value.trim()
  }

  return {
    type: type,
    channel: channel,
    header: headers,
    payload: body
  }
}

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
      const decoded = parse(message)

      server.received.push(decoded)
      let received = true

      for (const msg of server.received) {
        if (!server.expects.includes(msg.type)) {
          received = false
        }
      }

      if (received) {
        server.onSuccess()
      }

      if (decoded.type === 'ping') {
        ws.send('pong')
        return
      }

      if (decoded.type === 'subscribe') {
        for (const channel of decoded.payload.split(',')) {
          ws.send(`text ${channel}:subscribed\n\n${channel}`)
        }
        return
      }

      if (decoded.type === 'unsubscribe') {
        for (const channel of decoded.payload.split(',')) {
          ws.send(`text ${channel}:unsubscribed\n\n${channel}`)
        }
        return
      }

      server.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })
  })

  server.on('error', err => console.log(err))

  return server
}
