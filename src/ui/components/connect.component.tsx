import { when } from '@softsky/utils'
import { useRef } from 'react'

import { room } from '@/room'

import { useAsync, useSignal } from '../utilities'

function Connect() {
  const inputReference = useRef<HTMLInputElement>(null)
  const connected = useSignal(room.connected)

  const { loading, refresh: connect } = useAsync(async () => {
    room.connect(inputReference.current?.value)
    await when(room.connected)
  }, [])

  return (
    <>
      {!connected && (
        <div className='connect'>
          <input placeholder='Code' aria-label='Code' ref={inputReference} />
          <button className='submit' onClick={connect} disabled={loading}>
            Connect
          </button>
        </div>
      )}
    </>
  )
}

export default Connect
