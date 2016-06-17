import Socket  from 'socket.io-client'
import Ambient from './ambient.js'

const io = Socket(location.host)

io.on('hi', message => console.log(message))

Ambient
  .init()
  .on('add', box => {
    console.log('Ship the box through the socket >>', box)
    io.emit('add', box)
})

io.on('add', box => {
    console.log('Yo! Got a box from the socket', box)
  Ambient.add(box)})