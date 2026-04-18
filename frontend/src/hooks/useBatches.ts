import { useData } from './useData'
import { api } from '../api'
import { type Batch, type BatchInput } from '../types'

export function useBatches(onSuccess?: (message: string) => void, onError?: (message: string) => void) {
  return useData<Batch, BatchInput>({
    fetchAll: api.batches.list,
    create: api.batches.create,
    remove: api.batches.remove,
    onSuccess,
    onError,
  })
}