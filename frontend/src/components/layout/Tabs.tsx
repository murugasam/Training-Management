import { type TabKey } from '../../types'

interface Tab {
  key: TabKey
  label: string
  icon: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <nav className="tabs" aria-label="Management sections">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'active' : ''}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}