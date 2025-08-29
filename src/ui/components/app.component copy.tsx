import { room } from '@/room'

import { useSignal } from '../utilities'

import Connect from './connect.component'

function App() {
  const connected = useSignal(room.connected)
  return <>{connected && <Connect />}</>
}

export default App
