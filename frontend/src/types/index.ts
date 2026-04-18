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

export type CourseInput = {
  name: string
  subjects: string[]        // minimum 2 subject IDs
}

export type BatchInput = {
  name: string
  course: string            // single courseId
  starttime: string
  endtime: string
}

export type StudentInput = {
  name: string
  course: string
  batch: string
}

export type TabKey = 'subjects' | 'courses' | 'batches' | 'students'

export type DeleteTarget =
  | { type: 'subject'; id: string; label: string }
  | { type: 'course'; id: string; label: string }
  | { type: 'batch'; id: string; label: string }
  | { type: 'student'; id: string; label: string }

export type Toast = { id: number; message: string; kind: 'success' | 'error' }