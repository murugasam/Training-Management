import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'
import {
  api,
  type Batch,
  type Course,
  type Student,
  type Subject,
} from './api/index.ts'

/* ─────────────────────────── types ─────────────────────────── */
type TabKey = 'subjects' | 'courses' | 'batches' | 'students'
type DeleteTarget =
  | { type: 'subject'; id: string; label: string }
  | { type: 'course'; id: string; label: string }
  | { type: 'batch'; id: string; label: string }
  | { type: 'student'; id: string; label: string }

type Toast = { id: number; message: string; kind: 'success' | 'error' }

/* ─────────────────────────── constants ──────────────────────── */
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'subjects', label: 'Subjects',  icon: '📚' },
  { key: 'courses',  label: 'Courses',   icon: '🎓' },
  { key: 'batches',  label: 'Batches',   icon: '🗓️' },
  { key: 'students', label: 'Students',  icon: '🧑‍💻' },
]

const emptyCourseForm  = { name: '', subjectIds: [] as string[] }
const emptyBatchForm   = { name: '', courseId: '', starttime: '', endtime: '' }
const emptyStudentForm = { name: '', courseId: '', batchId: '' }

let toastCounter = 0

/* ─────────────────────────── helpers ───────────────────────── */
const getSubjectsFromCourse = (c: Course) =>
  c.subjects.filter((s): s is Subject => typeof s !== 'string')

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

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong.'

/* ═══════════════════════════════════════════════════════════════
   App
   ══════════════════════════════════════════════════════════════ */
function App() {
  const [activeTab, setActiveTab]     = useState<TabKey>('subjects')
  const [subjects,  setSubjects]      = useState<Subject[]>([])
  const [courses,   setCourses]       = useState<Course[]>([])
  const [batches,   setBatches]       = useState<Batch[]>([])
  const [students,  setStudents]      = useState<Student[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [courseForm,  setCourseForm]  = useState(emptyCourseForm)
  const [batchForm,   setBatchForm]   = useState(emptyBatchForm)
  const [studentForm, setStudentForm] = useState(emptyStudentForm)
  const [errors,   setErrors]         = useState<Record<string, string>>({})
  const [loading,  setLoading]        = useState(true)
  const [saving,   setSaving]         = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [toasts,   setToasts]         = useState<Toast[]>([])

  /* ── toast helpers ── */
  const showToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastCounter
    setToasts(t => [...t, { id, message, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  /* ── data loading ── */
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [subs, crs, bats, stus] = await Promise.all([
        api.subjects.list(),
        api.courses.list(),
        api.batches.list(),
        api.students.list(),
      ])
      setSubjects(subs)
      setCourses(crs)
      setBatches(bats)
      setStudents(stus)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void loadAll() }, [loadAll])

  /* ── dashboard stats ── */
  const stats = useMemo(() => [
    { label: 'Total Subjects', value: subjects.length, color: '#6366f1' },
    { label: 'Total Courses',  value: courses.length,  color: '#0ea5e9' },
    { label: 'Total Batches',  value: batches.length,  color: '#10b981' },
    { label: 'Total Students', value: students.length, color: '#f59e0b' },
  ], [subjects.length, courses.length, batches.length, students.length])

  /* ── filtered batches for the selected course (student form) ── */
  const batchesForCourse = useMemo(
    () => batches.filter(b => {
      const c = getCourseFromBatch(b)
      return c ? c._id === studentForm.courseId : b.course === studentForm.courseId
    }),
    [batches, studentForm.courseId],
  )

  /* ── field error helpers ── */
  const clearError = (key: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })

  /* ── submit: create subject ── */
  const createSubject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = subjectName.trim()
    if (!name) { setErrors({ subjectName: 'Subject name is required.' }); return }

    setSaving('subject')
    try {
      await api.subjects.create({ name })
      setSubjectName('')
      showToast(`Subject "${name}" added.`)
      await loadAll()
    } catch (err) {
      setErrors({ subjectName: getErrorMessage(err) })
    } finally { setSaving('') }
  }

  /* ── submit: create course ── */
  const createCourse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!courseForm.name.trim()) errs.courseName = 'Course name is required.'
    if (courseForm.subjectIds.length < 2)
      errs.courseSubjects = 'Select at least 2 subjects.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving('course')
    try {
      await api.courses.create({ name: courseForm.name.trim(), subjects: courseForm.subjectIds })
      setCourseForm(emptyCourseForm)
      showToast(`Course "${courseForm.name.trim()}" created.`)
      await loadAll()
    } catch (err) {
      setErrors({ courseName: getErrorMessage(err) })
    } finally { setSaving('') }
  }

  /* ── submit: create batch ── */
  const createBatch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!batchForm.name.trim())   errs.batchName   = 'Batch name is required.'
    if (!batchForm.courseId)      errs.batchCourse  = 'Choose a course.'
    if (!batchForm.starttime)     errs.batchStart   = 'Start time is required.'
    if (!batchForm.endtime)       errs.batchEnd     = 'End time is required.'
    if (batchForm.starttime && batchForm.endtime &&
        new Date(batchForm.endtime) <= new Date(batchForm.starttime))
      errs.batchEnd = 'End time must be after start time.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving('batch')
    try {
      await api.batches.create({
        name:      batchForm.name.trim(),
        course:    batchForm.courseId,   // single courseId
        starttime: batchForm.starttime,
        endtime:   batchForm.endtime,
      })
      setBatchForm(emptyBatchForm)
      showToast(`Batch "${batchForm.name.trim()}" created.`)
      await loadAll()
    } catch (err) {
      setErrors({ batchName: getErrorMessage(err) })
    } finally { setSaving('') }
  }

  /* ── submit: create student ── */
  const createStudent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!studentForm.name.trim()) errs.studentName   = 'Student name is required.'
    if (!studentForm.courseId)    errs.studentCourse  = 'Choose a course.'
    if (!studentForm.batchId)     errs.studentBatch   = 'Choose a batch.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Re-validate batch belongs to course
    const selectedBatch = batches.find(b => b._id === studentForm.batchId)
    if (selectedBatch) {
      const bCourse = getCourseFromBatch(selectedBatch)
      const bCourseId = bCourse ? bCourse._id : selectedBatch.course as string
      if (bCourseId !== studentForm.courseId) {
        setErrors({ studentBatch: 'Selected batch does not belong to chosen course.' })
        return
      }
    }

    setSaving('student')
    try {
      await api.students.create({
        name:   studentForm.name.trim(),
        course: studentForm.courseId,
        batch:  studentForm.batchId,
      })
      setStudentForm(emptyStudentForm)
      showToast(`Student "${studentForm.name.trim()}" enrolled.`)
      await loadAll()
    } catch (err) {
      setErrors({ studentName: getErrorMessage(err) })
    } finally { setSaving('') }
  }

  /* ── confirm delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(`del-${deleteTarget.id}`)
    try {
      if (deleteTarget.type === 'subject') await api.subjects.remove(deleteTarget.id)
      if (deleteTarget.type === 'course')  await api.courses.remove(deleteTarget.id)
      if (deleteTarget.type === 'batch')   await api.batches.remove(deleteTarget.id)
      if (deleteTarget.type === 'student') await api.students.remove(deleteTarget.id)
      showToast(`"${deleteTarget.label}" deleted.`)
      setDeleteTarget(null)
      await loadAll()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
      setDeleteTarget(null)
    } finally { setSaving('') }
  }

  /* ══════════════════════════════════════════
     Render
     ══════════════════════════════════════════ */
  return (
    <main className="app-shell">

      {/* ── Toast stack ── */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === 'success' ? '✓ ' : '✕ '}{t.message}
          </div>
        ))}
      </div>

      {/* ── Hero ── */}
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Training Management System</p>
          <h1>Manage Subjects, Courses, Batches &amp; Students</h1>
        </div>
        <button className="ghost-button" onClick={loadAll} disabled={loading}>
          <RefreshIcon />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {/* ── Dashboard stats ── */}
      <section className="stats-grid" aria-label="Summary statistics">
        {stats.map(s => (
          <article className="stat-card" key={s.label} style={{ '--accent': s.color } as React.CSSProperties}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </article>
        ))}
      </section>

      {/* ── Tabs ── */}
      <nav className="tabs" aria-label="Management sections">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => { setActiveTab(tab.key); setErrors({}) }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Workspace ── */}
      <section className="workspace">

        {/* SUBJECTS */}
        {activeTab === 'subjects' && (
          <ManagementPanel title="Subject Management" description="Add, view, and delete training subjects.">
            <form className="form-grid compact" onSubmit={createSubject} noValidate>
              <FieldError error={errors.subjectName}>
                <label htmlFor="subject-name">Subject name</label>
                <input
                  id="subject-name"
                  value={subjectName}
                  onChange={e => { setSubjectName(e.target.value); clearError('subjectName') }}
                  placeholder="e.g. React Fundamentals"
                  autoComplete="off"
                />
              </FieldError>
              <button
                type="submit"
                className="primary-button"
                disabled={saving === 'subject' || !subjectName.trim()}
              >
                <PlusIcon />
                {saving === 'subject' ? 'Adding…' : 'Add Subject'}
              </button>
            </form>
            <DataList
              emptyText="No subjects yet. Add one above."
              loading={loading}
              items={subjects.map(s => ({
                id: s._id,
                title: s.name,
                meta: 'Subject',
                badge: undefined,
                onDelete: () => setDeleteTarget({ type: 'subject', id: s._id, label: s.name }),
              }))}
              saving={saving}
            />
          </ManagementPanel>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <ManagementPanel title="Course Management" description="Create courses by grouping at least 2 subjects.">
            <form className="form-grid" onSubmit={createCourse} noValidate>
              <FieldError error={errors.courseName}>
                <label htmlFor="course-name">Course name</label>
                <input
                  id="course-name"
                  value={courseForm.name}
                  onChange={e => { setCourseForm({ ...courseForm, name: e.target.value }); clearError('courseName') }}
                  placeholder="e.g. Full Stack Development"
                  autoComplete="off"
                />
              </FieldError>
              <FieldError error={errors.courseSubjects}>
                <label htmlFor="course-subjects">
                  Subjects <span className="hint">(hold Ctrl / Cmd to select multiple — min 2)</span>
                </label>
                <select
                  id="course-subjects"
                  multiple
                  value={courseForm.subjectIds}
                  onChange={e => {
                    const ids = Array.from(e.target.selectedOptions, o => o.value)
                    setCourseForm({ ...courseForm, subjectIds: ids })
                    clearError('courseSubjects')
                  }}
                  disabled={subjects.length === 0}
                >
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {subjects.length === 0 && (
                  <span className="hint-text">⚠ Add at least 2 subjects first.</span>
                )}
              </FieldError>
              <button
                type="submit"
                className="primary-button"
                disabled={saving === 'course' || !courseForm.name.trim() || courseForm.subjectIds.length < 2}
              >
                <PlusIcon />
                {saving === 'course' ? 'Creating…' : 'Create Course'}
              </button>
            </form>
            <DataList
              emptyText="No courses yet. Create one above."
              loading={loading}
              items={courses.map(c => ({
                id: c._id,
                title: c.name,
                meta: getSubjectsFromCourse(c).map(s => s.name).join(', ') || 'No subjects linked',
                badge: `${getSubjectsFromCourse(c).length} subject${getSubjectsFromCourse(c).length !== 1 ? 's' : ''}`,
                onDelete: () => setDeleteTarget({ type: 'course', id: c._id, label: c.name }),
              }))}
              saving={saving}
            />
          </ManagementPanel>
        )}

        {/* BATCHES */}
        {activeTab === 'batches' && (
          <ManagementPanel title="Batch Management" description="Schedule batches for a course with a time window.">
            <form className="form-grid batch-grid" onSubmit={createBatch} noValidate>
              <FieldError error={errors.batchName}>
                <label htmlFor="batch-name">Batch name</label>
                <input
                  id="batch-name"
                  value={batchForm.name}
                  onChange={e => { setBatchForm({ ...batchForm, name: e.target.value }); clearError('batchName') }}
                  placeholder="e.g. Morning Batch A"
                  autoComplete="off"
                />
              </FieldError>
              <FieldError error={errors.batchCourse}>
                <label htmlFor="batch-course">Course</label>
                <select
                  id="batch-course"
                  value={batchForm.courseId}
                  onChange={e => { setBatchForm({ ...batchForm, courseId: e.target.value }); clearError('batchCourse') }}
                  disabled={courses.length === 0}
                >
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </FieldError>
              <FieldError error={errors.batchStart}>
                <label htmlFor="batch-start">Start date &amp; time</label>
                <input
                  id="batch-start"
                  type="datetime-local"
                  value={batchForm.starttime}
                  onChange={e => { setBatchForm({ ...batchForm, starttime: e.target.value }); clearError('batchStart') }}
                />
              </FieldError>
              <FieldError error={errors.batchEnd}>
                <label htmlFor="batch-end">End date &amp; time</label>
                <input
                  id="batch-end"
                  type="datetime-local"
                  value={batchForm.endtime}
                  onChange={e => { setBatchForm({ ...batchForm, endtime: e.target.value }); clearError('batchEnd') }}
                />
              </FieldError>
              <button
                type="submit"
                className="primary-button span-full"
                disabled={
                  saving === 'batch' || !batchForm.name.trim() ||
                  !batchForm.courseId || !batchForm.starttime || !batchForm.endtime
                }
              >
                <PlusIcon />
                {saving === 'batch' ? 'Creating…' : 'Create Batch'}
              </button>
            </form>
            <DataList
              emptyText="No batches yet. Create one above."
              loading={loading}
              items={batches.map(b => {
                const c = getCourseFromBatch(b)
                return {
                  id: b._id,
                  title: b.name,
                  meta: `${formatDate(b.starttime)} → ${formatDate(b.endtime)}`,
                  badge: c ? c.name : 'Unknown course',
                  onDelete: () => setDeleteTarget({ type: 'batch', id: b._id, label: b.name }),
                }
              })}
              saving={saving}
            />
          </ManagementPanel>
        )}

        {/* STUDENTS */}
        {activeTab === 'students' && (
          <ManagementPanel title="Student Management" description="Enroll students into a course and batch.">
            <form className="form-grid" onSubmit={createStudent} noValidate>
              <FieldError error={errors.studentName}>
                <label htmlFor="student-name">Student name</label>
                <input
                  id="student-name"
                  value={studentForm.name}
                  onChange={e => { setStudentForm({ ...studentForm, name: e.target.value }); clearError('studentName') }}
                  placeholder="e.g. Arun Kumar"
                  autoComplete="off"
                />
              </FieldError>
              <FieldError error={errors.studentCourse}>
                <label htmlFor="student-course">Course</label>
                <select
                  id="student-course"
                  value={studentForm.courseId}
                  onChange={e => {
                    setStudentForm({ ...studentForm, courseId: e.target.value, batchId: '' })
                    clearError('studentCourse')
                  }}
                  disabled={courses.length === 0}
                >
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </FieldError>
              <FieldError error={errors.studentBatch}>
                <label htmlFor="student-batch">Batch</label>
                <select
                  id="student-batch"
                  value={studentForm.batchId}
                  onChange={e => { setStudentForm({ ...studentForm, batchId: e.target.value }); clearError('studentBatch') }}
                  disabled={!studentForm.courseId || batchesForCourse.length === 0}
                >
                  <option value="">
                    {studentForm.courseId && batchesForCourse.length === 0
                      ? 'No batches for this course'
                      : 'Select batch…'}
                  </option>
                  {batchesForCourse.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({formatDate(b.starttime)} → {formatDate(b.endtime)})
                    </option>
                  ))}
                </select>
              </FieldError>
              <button
                type="submit"
                className="primary-button"
                disabled={saving === 'student' || !studentForm.name.trim() || !studentForm.courseId || !studentForm.batchId}
              >
                <PlusIcon />
                {saving === 'student' ? 'Enrolling…' : 'Enroll Student'}
              </button>
            </form>
            <DataList
              emptyText="No students yet. Enroll one above."
              loading={loading}
              items={students.map(s => {
                const c = getCourseFromStudent(s)
                const b = getBatchFromStudent(s)
                return {
                  id: s._id,
                  title: s.name,
                  meta: `${b ? `${b.name} — ${formatDate(b.starttime)} → ${formatDate(b.endtime)}` : 'Batch unknown'}`,
                  badge: c ? c.name : 'Course unknown',
                  onDelete: () => setDeleteTarget({ type: 'student', id: s._id, label: s.name }),
                }
              })}
              saving={saving}
            />
          </ManagementPanel>
        )}
      </section>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <h2>Confirm Delete</h2>
            <p>
              Delete <strong>{deleteTarget.label}</strong>?<br />
              <span className="modal-warning">This action cannot be undone.</span>
            </p>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="danger-button"
                onClick={confirmDelete}
                disabled={saving === `del-${deleteTarget.id}`}
              >
                <TrashIcon />
                {saving === `del-${deleteTarget.id}` ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */
function ManagementPanel({
  title, description, children,
}: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldError({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div className={error ? 'field has-error' : 'field'}>
      {children}
      {error && <span className="error-text" role="alert">{error}</span>}
    </div>
  )
}

function DataList({
  items, emptyText, loading, saving,
}: {
  items: Array<{ id: string; title: string; meta: string; badge?: string; onDelete: () => void }>
  emptyText: string
  loading: boolean
  saving: string
}) {
  if (loading) return <div className="empty-state loading-state">⏳ Loading records…</div>
  if (items.length === 0) return <div className="empty-state">{emptyText}</div>
  return (
    <div className="record-list">
      {items.map(item => (
        <article className="record-row" key={item.id}>
          <div className="record-info">
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
          </div>
          <div className="record-actions">
            {item.badge && <span className="badge">{item.badge}</span>}
            <button
              className="icon-button danger"
              onClick={item.onDelete}
              title={`Delete ${item.title}`}
              disabled={saving === `del-${item.id}`}
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ════════ Icons ════════ */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7l1-3h4l1 3" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6v5h-5M4 18v-5h5M18 9a7 7 0 0 0-11.5-2.5L4 9M6 15a7 7 0 0 0 11.5 2.5L20 15" />
    </svg>
  )
}

export default App
