import path from 'path'
import http from 'http'
import express from 'express'
import socket from 'socket.io'

export const app = express()

const server = http.Server(app),
      io     = socket(server),
      SERVER_PORT = process.env.PORT || 3000


app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (request, response) => {
  response.sendFile('index.html', { root: path.join(__dirname, 'public') })
})

io.on('connection', socket => {
  socket.emit('hi', {hi: ' hi there'})
})

app.set('port', SERVER_PORT)

server.listen(app.get('port'), () => {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
})