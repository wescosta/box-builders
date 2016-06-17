import Socket  from 'socket.io-client'
import Ambient from './ambient.js'

const io = Socket(location.host)

Ambient
  .init()
  .on('add', box => io.emit('add', box))

io.on('add', box => Ambient.add(box))