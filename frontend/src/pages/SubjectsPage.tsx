import { useState } from 'react'
import { useSubjects } from '../hooks/useSubjects'
import { ManagementPanel } from '../components/layout/ManagementPanel'
import { Input } from '../components/common/Input'
import { Button } from '../components/common/Button'
import { DataList } from '../components/common/DataList'
import { PlusIcon } from '../components/common/Icons'
import { type Subject, type DeleteTarget } from '../types'

interface SubjectsPageProps {
  showToast: (message: string, kind?: 'success' | 'error') => void
  setDeleteTarget: (target: DeleteTarget | null) => void
}

export function SubjectsPage({ showToast, setDeleteTarget }: SubjectsPageProps) {
  const [subjectName, setSubjectName] = useState('')
  const { items: subjects, loading, saving, createItem } = useSubjects(
    showToast,
    (message) => showToast(message, 'error')
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = subjectName.trim()
    if (!name) return

    await createItem({ name })
    setSubjectName('')
  }

  const handleDelete = (subject: Subject) => {
    setDeleteTarget({ type: 'subject', id: subject._id, label: subject.name })
  }

  return (
    <ManagementPanel title="Subject Management" description="Add, view, and delete training subjects.">
      <form className="form-grid compact" onSubmit={handleSubmit} noValidate>
        <Input
          id="subject-name"
          label="Subject name"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="e.g. React Fundamentals"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={saving === 'create' || !subjectName.trim()}
        >
          <PlusIcon />
          {saving === 'create' ? 'Adding…' : 'Add Subject'}
        </Button>
      </form>
      <DataList
        emptyText="No subjects yet. Add one above."
        loading={loading}
        saving={saving}
        items={subjects.map(s => ({
          id: s._id,
          title: s.name,
          meta: 'Subject',
          badge: undefined,
          onDelete: () => handleDelete(s),
        }))}
      />
    </ManagementPanel>
  )
}