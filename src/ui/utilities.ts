import { effect, Signal } from '@softsky/utils'
import { DependencyList, useCallback, useEffect, useState } from 'react'

export function useSignal<T>(signal: Signal<T>) {
  const [value, setValue] = useState(signal)
  useEffect(
    () =>
      effect(() => {
        setValue(signal())
      }),
    [signal],
  )
  return value
}

export function useAsync<T>(
  function_: () => Promise<T> | T,
  deps: DependencyList = [],
  manual?: boolean,
) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState<boolean>(!manual)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setData(await function_())
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, function_])

  useEffect(() => {
    if (!manual) void refresh()
  }, [refresh, manual])
  return { data, error, loading, refresh, setData }
}
