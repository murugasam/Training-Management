import { useState, useMemo } from 'react'
import './App.css'
import { useToast } from './hooks/useToast'
import { useSubjects } from './hooks/useSubjects'
import { useCourses } from './hooks/useCourses'
import { useBatches } from './hooks/useBatches'
import { useStudents } from './hooks/useStudents'
import { Header } from './components/layout/Header'
import { StatsGrid } from './components/layout/StatsGrid'
import { Tabs } from './components/layout/Tabs'
import { ToastContainer } from './components/common/Toast'
import { Modal } from './components/common/Modal'
import { Button } from './components/common/Button'
import { TrashIcon } from './components/common/Icons'
import { SubjectsPage } from './pages/SubjectsPage'
import { CoursesPage } from './pages/CoursesPage'
import { BatchesPage } from './pages/BatchesPage'
import { StudentsPage } from './pages/StudentsPage'
import { type TabKey, type DeleteTarget } from './types'

/* ─────────────────────────── constants ──────────────────────────── */
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'subjects', label: 'Subjects',  icon: '📚' },
  { key: 'courses',  label: 'Courses',   icon: '🎓' },
  { key: 'batches',  label: 'Batches',   icon: '🗓️' },
  { key: 'students', label: 'Students',  icon: '🧑‍💻' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('subjects')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const { toasts, showToast } = useToast()

  // Load all data for stats
  const { items: subjects, deleteItem: deleteSubject } = useSubjects(showToast, (message) => showToast(message, 'error'))
  const { items: courses, deleteItem: deleteCourse } = useCourses(showToast, (message) => showToast(message, 'error'))
  const { items: batches, deleteItem: deleteBatch } = useBatches(showToast, (message) => showToast(message, 'error'))
  const { items: students, deleteItem: deleteStudent } = useStudents(showToast, (message) => showToast(message, 'error'))

  /* ── dashboard stats ── */
  const stats = useMemo(() => [
    { label: 'Total Subjects', value: subjects.length, color: '#6366f1' },
    { label: 'Total Courses',  value: courses.length,  color: '#0ea5e9' },
    { label: 'Total Batches',  value: batches.length,  color: '#10b981' },
    { label: 'Total Students', value: students.length, color: '#f59e0b' },
  ], [subjects.length, courses.length, batches.length, students.length])

  /* ── refresh all data ── */
  const handleRefresh = () => {
    window.location.reload() // Simple refresh for now
  }

  /* ── delete confirmation ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      switch (deleteTarget.type) {
        case 'subject':
          await deleteSubject(deleteTarget.id, deleteTarget.label)
          break
        case 'course':
          await deleteCourse(deleteTarget.id, deleteTarget.label)
          break
        case 'batch':
          await deleteBatch(deleteTarget.id, deleteTarget.label)
          break
        case 'student':
          await deleteStudent(deleteTarget.id, deleteTarget.label)
          break
      }
      showToast(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted successfully`)
    } catch (error) {
      showToast('Failed to delete item', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  /* ── render active page ── */
  const renderActivePage = () => {
    switch (activeTab) {
      case 'subjects':
        return <SubjectsPage showToast={showToast} setDeleteTarget={setDeleteTarget} />
      case 'courses':
        return <CoursesPage showToast={showToast} setDeleteTarget={setDeleteTarget} />
      case 'batches':
        return <BatchesPage showToast={showToast} setDeleteTarget={setDeleteTarget} />
      case 'students':
        return <StudentsPage showToast={showToast} setDeleteTarget={setDeleteTarget} />
      default:
        return <SubjectsPage showToast={showToast} setDeleteTarget={setDeleteTarget} />
    }
  }

  return (
    <div className="app">
      <Header onRefresh={handleRefresh} loading={false} />
      <main className="main-content">
        <StatsGrid stats={stats} />
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {renderActivePage()}
      </main>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
      >
        <p className="mb-4">
          Are you sure you want to delete <strong>{deleteTarget?.label}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
          >
            <TrashIcon />
            Delete
          </Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
