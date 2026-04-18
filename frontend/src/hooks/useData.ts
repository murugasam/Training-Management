import { useCallback, useEffect, useState } from 'react'

interface UseDataOptions<T, TInput> {
  fetchAll: () => Promise<T[]>
  create: (data: TInput) => Promise<T>
  remove: (id: string) => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useData<T, TInput>({
  fetchAll,
  create,
  remove,
  onSuccess,
  onError,
}: UseDataOptions<T, TInput>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAll()
      setItems(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [fetchAll, onError])

  const createItem = useCallback(async (data: TInput) => {
    setSaving('create')
    try {
      await create(data)
      onSuccess?.('Item created successfully')
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create item'
      onError?.(message)
    } finally {
      setSaving('')
    }
  }, [create, onSuccess, onError, loadData])

  const deleteItem = useCallback(async (id: string, label: string) => {
    setSaving(`del-${id}`)
    try {
      await remove(id)
      onSuccess?.(`"${label}" deleted successfully`)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item'
      onError?.(message)
    } finally {
      setSaving('')
    }
  }, [remove, onSuccess, onError, loadData])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return {
    items,
    loading,
    saving,
    loadData,
    createItem,
    deleteItem,
  }
}