import { useState, useMemo } from 'react'
import { useCourses } from '../hooks/useCourses'
import { useBatches } from '../hooks/useBatches'
import { useStudents } from '../hooks/useStudents'
import { ManagementPanel } from '../components/layout/ManagementPanel'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { Button } from '../components/common/Button'
import { DataList } from '../components/common/DataList'
import { PlusIcon } from '../components/common/Icons'
import { type Student, type Batch, type Course, type DeleteTarget } from '../types'

interface StudentsPageProps {
  showToast: (message: string, kind?: 'success' | 'error') => void
  setDeleteTarget: (target: DeleteTarget | null) => void
}

export function StudentsPage({ showToast, setDeleteTarget }: StudentsPageProps) {
  const [studentForm, setStudentForm] = useState({
    name: '',
    courseId: '',
    batchId: ''
  })
  const { items: courses } = useCourses()
  const { items: batches } = useBatches()
  const { items: students, loading, saving, createItem } = useStudents(
    showToast,
    (message) => showToast(message, 'error')
  )

  const batchesForCourse = useMemo(
    () => batches.filter(b => {
      const c = getCourseFromBatch(b)
      return c ? c._id === studentForm.courseId : b.course === studentForm.courseId
    }),
    [batches, studentForm.courseId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, courseId, batchId } = studentForm
    if (!name.trim() || !courseId || !batchId) return

    // Re-validate batch belongs to course
    const selectedBatch = batches.find(b => b._id === batchId)
    if (selectedBatch) {
      const bCourse = getCourseFromBatch(selectedBatch)
      const bCourseId = bCourse ? bCourse._id : selectedBatch.course as string
      if (bCourseId !== courseId) {
        showToast('Selected batch does not belong to chosen course.', 'error')
        return
      }
    }

    await createItem({
      name: name.trim(),
      course: courseId,
      batch: batchId,
    })
    setStudentForm({ name: '', courseId: '', batchId: '' })
  }

  const handleDelete = (student: Student) => {
    setDeleteTarget({ type: 'student', id: student._id, label: student.name })
  }

  const getCourseFromBatch = (b: Batch): Course | null =>
    typeof b.course === 'string' ? null : b.course

  const getCourseFromStudent = (s: Student): Course | null =>
    typeof s.course === 'string' ? null : s.course

  const getBatchFromStudent = (s: Student): Batch | null =>
    typeof s.batch === 'string' ? null : s.batch

  const formatDate = (val: string) => {
    if (!val) return 'Not set'
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(val))
  }

  return (
    <ManagementPanel title="Student Management" description="Enroll students into a course and batch.">
      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <Input
          id="student-name"
          label="Student name"
          value={studentForm.name}
          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
          placeholder="e.g. Arun Kumar"
          autoComplete="off"
        />
        <Select
          id="student-course"
          label="Course"
          value={studentForm.courseId}
          onChange={(e) => {
            setStudentForm({ ...studentForm, courseId: e.target.value, batchId: '' })
          }}
          options={courses.map(c => ({ value: c._id, label: c.name }))}
          placeholder="Select course…"
        />
        <Select
          id="student-batch"
          label="Batch"
          value={studentForm.batchId}
          onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })}
          options={batchesForCourse.map(b => ({
            value: b._id,
            label: `${b.name} (${formatDate(b.starttime)} → ${formatDate(b.endtime)})`
          }))}
          placeholder={
            studentForm.courseId && batchesForCourse.length === 0
              ? 'No batches for this course'
              : 'Select batch…'
          }
          disabled={!studentForm.courseId || batchesForCourse.length === 0}
        />
        <Button
          type="submit"
          disabled={saving === 'create' || !studentForm.name.trim() || !studentForm.courseId || !studentForm.batchId}
        >
          <PlusIcon />
          {saving === 'create' ? 'Enrolling…' : 'Enroll Student'}
        </Button>
      </form>
      <DataList
        emptyText="No students yet. Enroll one above."
        loading={loading}
        saving={saving}
        items={students.map(s => {
          const c = getCourseFromStudent(s)
          const b = getBatchFromStudent(s)
          return {
            id: s._id,
            title: s.name,
            meta: `${b ? `${b.name} — ${formatDate(b.starttime)} → ${formatDate(b.endtime)}` : 'Batch unknown'}`,
            badge: c ? c.name : 'Course unknown',
            onDelete: () => handleDelete(s),
          }
        })}
      />
    </ManagementPanel>
  )
}