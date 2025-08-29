import { removeFromArray } from '@softsky/utils'
import { serve } from 'bun'

type WSData = string
type Room = Bun.ServerWebSocket<WSData>[]

const rooms = new Map<string, Room>()

serve<WSData, object>({
  port: 54_345,
  fetch(request, server) {
    const url = new URL(request.url)
    const roomId = url.searchParams.get('room')
    if (!roomId) return new Response('Wrong interface', { status: 400 })
    server.upgrade(request, {
      data: roomId,
    })
  },
  websocket: {
    open(ws) {
      let room = rooms.get(ws.data)
      if (!room) {
        room = []
        rooms.set(ws.data, room)
      }
      if (room.length === 3) {
        ws.close()
        return
      }
      room.push(ws)
      room[0]!.sendText(`s,r,${room.length}`)
    },
    close(ws) {
      const room = rooms.get(ws.data)
      if (!room) return
      removeFromArray(room, ws)
      if (room.length === 0) rooms.delete(ws.data)
      else room[0]!.sendText(`s,r,${room.length}`)
    },
    message(ws, message) {
      const room = rooms.get(ws.data)
      if (!room || typeof message !== 'string') {
        ws.close()
        return
      }
      room[0]!.sendText(`${room.indexOf(ws)},${message}`)
    },
  },
})
