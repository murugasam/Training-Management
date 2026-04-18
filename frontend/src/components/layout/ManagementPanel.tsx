import { type ReactNode } from 'react'

interface ManagementPanelProps {
  title: string
  description: string
  children: ReactNode
}

export function ManagementPanel({ title, description, children }: ManagementPanelProps) {
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