export default function startPhoneGame() {
  const canvas = document.querySelector('canvas')!
  const context = canvas.getContext('2d')!
  context.fillStyle = 'red'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const socket = new WebSocket(`ws://${document.location.hostname}:54345`)
  socket.addEventListener('open', () => {
    context.fillStyle = 'green'
    socket.send(`size,${window.innerWidth},${window.innerHeight}`)
    socket.addEventListener('message', ({ data }) => {
      if (typeof data !== 'string') return
      const index = data.indexOf(',')
      const eventName = index === -1 ? data : data.slice(0, index)
      const _body = index === -1 ? undefined : data.slice(index + 1)
      switch (eventName) {
        case 'a': {
          console.log(_body)
        }
      }
    })
    globalThis.addEventListener('devicemotion', (event) => {
      socket.send(
        `motion,${event.accelerationIncludingGravity?.x ?? 0},${
          event.accelerationIncludingGravity?.y ?? 0
        },${event.accelerationIncludingGravity?.z ?? 0},${
          event.rotationRate?.alpha ?? 0
        },${event.rotationRate?.beta ?? 0},${event.rotationRate?.gamma ?? 0}`,
      )
    })
    globalThis.addEventListener('deviceorientation', (event) => {
      socket.send(
        `rotation,${event.alpha ?? 0},${event.beta ?? 0},${event.gamma ?? 0}`,
      )
    })
    document.addEventListener('touchstart', (event) => {
      socket.send(
        `touchStart,${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    })
    document.addEventListener('touchmove', (event) => {
      socket.send(
        `touchMove,${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    })
    document.addEventListener('touchend', (event) => {
      socket.send(
        `touchEnd,${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    })
  })
  socket.addEventListener('close', () => {
    setTimeout(() => {
      document.location.reload()
    }, 5000)
  })
  socket.addEventListener('error', (error) => {
    console.error(error)
    setTimeout(() => {
      document.location.reload()
    }, 5000)
  })
}
