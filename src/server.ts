import { WebSocket, WebSocketServer } from 'ws'

const wss = new WebSocketServer({
  port: 54_345,
})
const room: (WebSocket | undefined)[] = [undefined, undefined]
wss.addListener('connection', (socket) => {
  socket.addEventListener('message', ({ data }) => {
    for (let index = 0; index < room.length; index++) {
      const roomSocket = room[index]
      if (roomSocket && roomSocket !== socket) roomSocket.send(data)
    }
  })
})
