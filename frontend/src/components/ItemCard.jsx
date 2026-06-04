import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const CATEGORY_ICONS = {
  electronics: '💻',
  bag:         '👜',
  keys:        '🔑',
  wallet:      '👛',
  clothing:    '👕',
  documents:   '📄',
  other:       '📦',
}

export default function ItemCard({ item }) {
  const icon = CATEGORY_ICONS[item.category] ?? '📦'
  const isFound = item.status === 'found'

  return (
    <Link
      to={`/items/${item.id}`}
      className={`block rounded-xl border p-4 hover:shadow-md transition-shadow bg-white
        ${isFound ? 'border-amber-400 shadow-amber-100 shadow-sm' : 'border-gray-200'}`}
    >
      {isFound && (
        <div className="mb-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-2 py-1 inline-block">
          ✨ Possibly Found!
        </div>
      )}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{item.category}</p>
          {item.last_scan && (
            <p className="text-xs text-gray-400 mt-1">
              Last scan: {new Date(item.last_scan).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
