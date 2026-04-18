const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ??
  '/api'

export type Subject = {
  _id: string
  name: string
}

export type Course = {
  _id: string
  name: string
  subjects: Array<string | Subject>
  createdAt?: string
  updatedAt?: string
}

export type Batch = {
  _id: string
  name: string
  course: string | Course  // single course ref (not array)
  starttime: string
  endtime: string
  createdAt?: string
  updatedAt?: string
}

export type Student = {
  _id: string
  name: string
  course: string | Course   // lowercase field names
  batch: string | Batch
  createdAt?: string
  updatedAt?: string
}

type CourseInput = {
  name: string
  subjects: string[]        // minimum 2 subject IDs
}

type BatchInput = {
  name: string
  course: string            // single courseId
  starttime: string
  endtime: string
}

type StudentInput = {
  name: string
  course: string            // lowercase
  batch: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  const text = await response.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }

  if (!response.ok) {
    const msg =
      data !== null && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : typeof data === 'string' && data
        ? data
        : 'Request failed'
    throw new Error(msg)
  }

  return data as T
}

const remove = (path: string) =>
  request<{ message?: string }>(path, { method: 'DELETE' })

export const api = {
  subjects: {
    list: () => request<Subject[]>('/subjects'),
    create: (payload: Pick<Subject, 'name'>) =>
      request<Subject>('/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/subjects/${id}`),
  },
  courses: {
    list: () => request<Course[]>('/courses'),
    create: (payload: CourseInput) =>
      request<Course>('/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/courses/${id}`),
  },
  batches: {
    list: () => request<Batch[]>('/batches'),
    create: (payload: BatchInput) =>
      request<Batch>('/batches', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/batches/${id}`),
  },
  students: {
    list: () => request<Student[]>('/students'),
    create: (payload: StudentInput) =>
      request<Student>('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) => remove(`/students/${id}`),
  },
}
