import { useData } from './useData'
import { api } from '../api'
import { type Course, type CourseInput } from '../types'

export function useCourses(onSuccess?: (message: string) => void, onError?: (message: string) => void) {
  return useData<Course, CourseInput>({
    fetchAll: api.courses.list,
    create: api.courses.create,
    remove: api.courses.remove,
    onSuccess,
    onError,
  })
}