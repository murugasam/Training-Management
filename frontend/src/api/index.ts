import type {
  Subject,
  Course,
  Batch,
  Student,
  CourseInput,
  BatchInput,
  StudentInput,
} from '../types'

const API_BASE_URL = 'https://training-management-zqs0.onrender.com'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint)
}

async function remove(endpoint: string): Promise<void> {
  await request(endpoint, { method: 'DELETE' })
}

export const api = {
  subjects: {
    list: () => get<Subject[]>('/subjects'),
    create: (payload: { name: string }) =>
      request<Subject>('/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/subjects/${id}`),
  },
  courses: {
    list: () => get<Course[]>('/courses'),
    create: (payload: CourseInput) =>
      request<Course>('/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/courses/${id}`),
  },
  batches: {
    list: () => get<Batch[]>('/batches'),
    create: (payload: BatchInput) =>
      request<Batch>('/batches', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/batches/${id}`),
  },
  students: {
    list: () => get<Student[]>('/students'),
    create: (payload: StudentInput) =>
      request<Student>('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/students/${id}`),
  },
}
