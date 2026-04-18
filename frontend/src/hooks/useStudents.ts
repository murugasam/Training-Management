import { useData } from './useData'
import { api } from '../api'
import { type Student, type StudentInput } from '../types'

export function useStudents(onSuccess?: (message: string) => void, onError?: (message: string) => void) {
  return useData<Student, StudentInput>({
    fetchAll: api.students.list,
    create: api.students.create,
    remove: api.students.remove,
    onSuccess,
    onError,
  })
}