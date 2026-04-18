import { Button } from '../common/Button'
import { RefreshIcon } from '../common/Icons'

interface HeaderProps {
  onRefresh: () => void
  loading: boolean
}

export function Header({ onRefresh, loading }: HeaderProps) {
  return (
    <header className="hero-panel">
      <div>
        <p className="eyebrow">Training Management System</p>
        <h1>Manage Subjects, Courses, Batches &amp; Students</h1>
      </div>
      <Button
        variant="ghost"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshIcon />
        {loading ? 'Loading…' : 'Refresh'}
      </Button>
    </header>
  )
}