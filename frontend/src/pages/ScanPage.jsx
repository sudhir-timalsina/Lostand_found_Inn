import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORY_ICONS = {
  electronics: '💻',
  bag:         '👜',
  keys:        '🔑',
  wallet:      '👛',
  clothing:    '👕',
  documents:   '📄',
  other:       '📦',
}

const GATED_MESSAGES = {
  registered: 'This item is registered but has not been reported lost by its owner.',
  found:      'This item has already been found.',
  returned:   'This item has been returned to its owner.',
}

export default function ScanPage() {
  const { token } = useParams()
  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('loading') // loading | gated | ready | locating | done | error
  const [gatedMessage, setGatedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchItem()
  }, [token])

  async function fetchItem() {
    try {
      const res = await fetch(`${API_URL}/api/scan/${token}`)
      if (!res.ok) {
        setErrorMessage('This QR code is not valid or the item was removed.')
        setStatus('error')
        return
      }
      const data = await res.json()
      if (data.status !== 'lost') {
        setGatedMessage(GATED_MESSAGES[data.status] ?? 'This item is not currently marked as lost.')
        setStatus('gated')
      } else {
        setItem(data)
        setStatus('ready')
      }
    } catch {
      setErrorMessage('Could not connect. Please try again.')
      setStatus('error')
    }
  }

  async function handleFoundPress() {
    setStatus('locating')

    let latitude = null
    let longitude = null
    let accuracy = null
    let location_source = 'none'

    // Try GPS first
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        })
      })
      latitude = pos.coords.latitude
      longitude = pos.coords.longitude
      accuracy = pos.coords.accuracy
      location_source = 'gps'
    } catch {
      // GPS failed — try IP geolocation
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        latitude = data.latitude
        longitude = data.longitude
        accuracy = null
        location_source = 'ip'
      } catch {
        location_source = 'none'
      }
    }

    try {
      const res = await fetch(`${API_URL}/api/scan/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, accuracy, location_source }),
      })
      const data = await res.json()
      if (data.gated) {
        setGatedMessage(data.message)
        setStatus('gated')
      } else {
        setStatus('done')
      }
    } catch {
      setErrorMessage('Failed to notify owner. Please try again.')
      setStatus('error')
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <CenteredPage>
        <div className="animate-spin text-4xl">⏳</div>
        <p className="text-gray-400 text-sm mt-3">Loading…</p>
      </CenteredPage>
    )
  }

  // Error
  if (status === 'error') {
    return (
      <CenteredPage>
        <div className="text-4xl">❓</div>
        <p className="text-gray-600 mt-3 text-center">{errorMessage}</p>
      </CenteredPage>
    )
  }

  // Gated — item not lost
  if (status === 'gated') {
    return (
      <CenteredPage>
        <div className="text-5xl">ℹ️</div>
        <p className="text-gray-600 mt-4 text-center max-w-xs">{gatedMessage}</p>
      </CenteredPage>
    )
  }

  // Locating
  if (status === 'locating') {
    return (
      <CenteredPage>
        <div className="animate-spin text-4xl">📍</div>
        <p className="text-gray-500 mt-4 text-sm">Getting your location…</p>
      </CenteredPage>
    )
  }

  // Done — thank you screen
  if (status === 'done') {
    return (
      <CenteredPage>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
          ✅
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Thank you!</h2>
        <p className="text-gray-500 text-center mt-2 max-w-xs">
          The owner has been notified with your location.
        </p>
        <p className="text-gray-400 text-sm mt-4">You can close this page.</p>
      </CenteredPage>
    )
  }

  // Ready — show the button
  const icon = CATEGORY_ICONS[item?.category] ?? '📦'

  return (
    <CenteredPage>
      <div className="text-7xl">{icon}</div>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">{item?.name}</h2>
      <p className="text-gray-500 text-sm mt-1">Lost item</p>

      <button
        onClick={handleFoundPress}
        className="mt-8 w-full max-w-xs bg-indigo-600 text-white rounded-xl py-4 text-base font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
      >
        I Found This Item
      </button>

      <p className="text-gray-400 text-xs text-center mt-4 max-w-xs leading-relaxed">
        Pressing this shares your location with the owner.
        No sign-in needed.
        Your name and contact are never collected.
      </p>
    </CenteredPage>
  )
}

function CenteredPage({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
