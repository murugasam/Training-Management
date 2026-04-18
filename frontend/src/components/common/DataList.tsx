import { Button } from './Button'
import { TrashIcon } from './Icons'

interface DataListItem {
  id: string
  title: string
  meta: string
  badge?: string
  onDelete: () => void
}

interface DataListProps {
  items: DataListItem[]
  emptyText: string
  loading: boolean
  saving: string
}

export function DataList({ items, emptyText, loading, saving }: DataListProps) {
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
            <Button
              variant="danger"
              className="icon-button"
              onClick={item.onDelete}
              title={`Delete ${item.title}`}
              disabled={saving === `del-${item.id}`}
            >
              <TrashIcon />
              <span>Delete</span>
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}