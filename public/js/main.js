import Socket  from 'socket.io-client'
import Ambient from './ambient.js'

const io = Socket(location.host)

io.on('hi', message => console.log(message))

Ambient.init()