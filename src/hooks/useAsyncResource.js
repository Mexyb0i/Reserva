import { useCallback, useEffect, useState } from 'react'

function useAsyncResource(loader) {
  const [result, setResult] = useState({ loader: null, attempt: -1, data: null, error: '' })
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => setAttempt((current) => current + 1), [])

  useEffect(() => {
    let isCurrent = true

    loader()
      .then((result) => {
        if (isCurrent) setResult({ loader, attempt, data: result, error: '' })
      })
      .catch((loadError) => {
        if (isCurrent) {
          setResult({
            loader,
            attempt,
            data: null,
            error: loadError instanceof Error ? loadError.message : 'Unable to load this information.',
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [attempt, loader])

  const isCurrentResult = result.loader === loader && result.attempt === attempt
  return {
    data: isCurrentResult ? result.data : null,
    isLoading: !isCurrentResult,
    error: isCurrentResult ? result.error : '',
    reload,
  }
}

export default useAsyncResource
