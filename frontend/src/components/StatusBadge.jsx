const STATUS_CONFIG = {
  registered: { label: 'Registered', classes: 'bg-gray-100 text-gray-700' },
  lost:       { label: 'Lost',       classes: 'bg-red-100 text-red-700' },
  found:      { label: 'Found',      classes: 'bg-amber-100 text-amber-700' },
  returned:   { label: 'Returned',   classes: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.registered
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
