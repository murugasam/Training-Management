import { useState } from 'react'
import { useSubjects } from '../hooks/useSubjects'
import { useCourses } from '../hooks/useCourses'
import { ManagementPanel } from '../components/layout/ManagementPanel'
import { Input } from '../components/common/Input'
import { Button } from '../components/common/Button'
import { DataList } from '../components/common/DataList'
import { PlusIcon } from '../components/common/Icons'
import { type Course, type Subject, type DeleteTarget } from '../types'

interface CoursesPageProps {
  showToast: (message: string, kind?: 'success' | 'error') => void
  setDeleteTarget: (target: DeleteTarget | null) => void
}

export function CoursesPage({ showToast, setDeleteTarget }: CoursesPageProps) {
  const [courseForm, setCourseForm] = useState({ name: '', subjectIds: [] as string[] })
  const { items: subjects } = useSubjects()
  const { items: courses, loading, saving, createItem } = useCourses(
    showToast,
    (message) => showToast(message, 'error')
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = courseForm.name.trim()
    if (!name || courseForm.subjectIds.length < 2) return

    await createItem({ name, subjects: courseForm.subjectIds })
    setCourseForm({ name: '', subjectIds: [] })
  }

  const handleDelete = (course: Course) => {
    setDeleteTarget({ type: 'course', id: course._id, label: course.name })
  }

  const getSubjectsFromCourse = (c: Course) =>
    c.subjects.filter((s): s is Subject => typeof s !== 'string')

  return (
    <ManagementPanel title="Course Management" description="Create courses by grouping at least 2 subjects.">
      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <Input
          id="course-name"
          label="Course name"
          value={courseForm.name}
          onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
          placeholder="e.g. Full Stack Development"
          autoComplete="off"
        />
        <div className="field">
          <label htmlFor="course-subjects">
            Subjects <span className="hint">(hold Ctrl / Cmd to select multiple — min 2)</span>
          </label>
          <select
            id="course-subjects"
            multiple
            value={courseForm.subjectIds}
            onChange={(e) => {
              const ids = Array.from(e.target.selectedOptions, o => o.value)
              setCourseForm({ ...courseForm, subjectIds: ids })
            }}
            disabled={subjects.length === 0}
          >
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {subjects.length === 0 && (
            <span className="hint-text">⚠ Add at least 2 subjects first.</span>
          )}
        </div>
        <Button
          type="submit"
          disabled={saving === 'create' || !courseForm.name.trim() || courseForm.subjectIds.length < 2}
        >
          <PlusIcon />
          {saving === 'create' ? 'Creating…' : 'Create Course'}
        </Button>
      </form>
      <DataList
        emptyText="No courses yet. Create one above."
        loading={loading}
        saving={saving}
        items={courses.map(c => ({
          id: c._id,
          title: c.name,
          meta: getSubjectsFromCourse(c).map(s => s.name).join(', ') || 'No subjects linked',
          badge: `${getSubjectsFromCourse(c).length} subject${getSubjectsFromCourse(c).length !== 1 ? 's' : ''}`,
          onDelete: () => handleDelete(c),
        }))}
      />
    </ManagementPanel>
  )
}