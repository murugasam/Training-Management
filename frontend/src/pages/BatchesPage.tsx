import { useState } from 'react'
import { useCourses } from '../hooks/useCourses'
import { useBatches } from '../hooks/useBatches'
import { ManagementPanel } from '../components/layout/ManagementPanel'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { Button } from '../components/common/Button'
import { DataList } from '../components/common/DataList'
import { PlusIcon } from '../components/common/Icons'
import { type Batch, type Course, type DeleteTarget } from '../types'

interface BatchesPageProps {
  showToast: (message: string, kind?: 'success' | 'error') => void
  setDeleteTarget: (target: DeleteTarget | null) => void
}

export function BatchesPage({ showToast, setDeleteTarget }: BatchesPageProps) {
  const [batchForm, setBatchForm] = useState({
    name: '',
    courseId: '',
    starttime: '',
    endtime: ''
  })
  const { items: courses } = useCourses()
  const { items: batches, loading, saving, createItem } = useBatches(
    showToast,
    (message) => showToast(message, 'error')
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, courseId, starttime, endtime } = batchForm
    if (!name.trim() || !courseId || !starttime || !endtime) return

    if (new Date(endtime) <= new Date(starttime)) {
      showToast('End time must be after start time.', 'error')
      return
    }

    await createItem({
      name: name.trim(),
      course: courseId,
      starttime,
      endtime,
    })
    setBatchForm({ name: '', courseId: '', starttime: '', endtime: '' })
  }

  const handleDelete = (batch: Batch) => {
    setDeleteTarget({ type: 'batch', id: batch._id, label: batch.name })
  }

  const getCourseFromBatch = (b: Batch): Course | null =>
    typeof b.course === 'string' ? null : b.course

  const formatDate = (val: string) => {
    if (!val) return 'Not set'
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(val))
  }

  return (
    <ManagementPanel title="Batch Management" description="Schedule batches for a course with a time window.">
      <form className="form-grid batch-grid" onSubmit={handleSubmit} noValidate>
        <Input
          id="batch-name"
          label="Batch name"
          value={batchForm.name}
          onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
          placeholder="e.g. Morning Batch A"
          autoComplete="off"
        />
        <Select
          id="batch-course"
          label="Course"
          value={batchForm.courseId}
          onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
          options={courses.map(c => ({ value: c._id, label: c.name }))}
          placeholder="Select course…"
        />
        <Input
          id="batch-start"
          label="Start date & time"
          type="datetime-local"
          value={batchForm.starttime}
          onChange={(e) => setBatchForm({ ...batchForm, starttime: e.target.value })}
        />
        <Input
          id="batch-end"
          label="End date & time"
          type="datetime-local"
          value={batchForm.endtime}
          onChange={(e) => setBatchForm({ ...batchForm, endtime: e.target.value })}
        />
        <Button
          type="submit"
          className="span-full"
          disabled={
            saving === 'create' || !batchForm.name.trim() ||
            !batchForm.courseId || !batchForm.starttime || !batchForm.endtime
          }
        >
          <PlusIcon />
          {saving === 'create' ? 'Creating…' : 'Create Batch'}
        </Button>
      </form>
      <DataList
        emptyText="No batches yet. Create one above."
        loading={loading}
        saving={saving}
        items={batches.map(b => {
          const c = getCourseFromBatch(b)
          return {
            id: b._id,
            title: b.name,
            meta: `${formatDate(b.starttime)} → ${formatDate(b.endtime)}`,
            badge: c ? c.name : 'Unknown course',
            onDelete: () => handleDelete(b),
          }
        })}
      />
    </ManagementPanel>
  )
}