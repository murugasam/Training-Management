interface StatItem {
  label: string
  value: number
  color: string
}

interface StatsGridProps {
  stats: StatItem[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="stats-grid" aria-label="Summary statistics">
      {stats.map(s => (
        <article
          className="stat-card"
          key={s.label}
          style={{ '--accent': s.color } as React.CSSProperties}
        >
          <span>{s.label}</span>
          <strong>{s.value}</strong>
        </article>
      ))}
    </section>
  )
}