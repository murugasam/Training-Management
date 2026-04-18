import { useData } from './useData'
import { api } from '../api'
import { type Subject } from '../types'

export function useSubjects(onSuccess?: (message: string) => void, onError?: (message: string) => void) {
  return useData<Subject, Pick<Subject, 'name'>>({
    fetchAll: api.subjects.list,
    create: api.subjects.create,
    remove: api.subjects.remove,
    onSuccess,
    onError,
  })
}