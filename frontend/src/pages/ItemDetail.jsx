import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import QRDisplay from '../components/QRDisplay'
import ScanMap from '../components/ScanMap'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORY_ICONS = {
  electronics: '💻', bag: '👜', keys: '🔑',
  wallet: '👛', clothing: '👕', documents: '📄', other: '📦',
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    init()
  }, [id])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login'); return }
    setToken(session.access_token)
    await Promise.all([loadItem(session.access_token), loadScans(session.access_token)])
    setLoading(false)
  }

  async function loadItem(tok) {
    const res = await fetch(`${API_URL}/api/items`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (!res.ok) { setError('Failed to load item'); return }
    const items = await res.json()
    const found = items.find(i => i.id === id)
    if (!found) { setError('Item not found'); return }
    setItem(found)
  }

  async function loadScans(tok) {
    const res = await fetch(`${API_URL}/api/items/${id}/scans`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const data = await res.json()
      setScans(data)
    }
  }

  async function updateStatus(status) {
    setUpdating(true)
    const res = await fetch(`${API_URL}/api/items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItem(updated)
    }
    setUpdating(false)
  }

  async function deleteItem() {
    if (!confirm('Delete this item and its QR code? This cannot be undone.')) return
    const res = await fetch(`${API_URL}/api/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center text-gray-400 py-16">Loading…</div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error || 'Item not found'}</div>
          <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">← Dashboard</Link>
        </div>
      </div>
    )
  }

  const icon = CATEGORY_ICONS[item.category] ?? '📦'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        </div>

        {/* Item info card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            {item.photo_url ? (
              <img src={item.photo_url} alt={item.name}
                className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-4xl">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-gray-900 text-lg">{item.name}</h2>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-gray-500 capitalize mt-1">{item.category}</p>
              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}
            </div>
          </div>

          {/* Status action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            {item.status === 'registered' && (
              <button onClick={() => updateStatus('lost')} disabled={updating}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                Mark as Lost
              </button>
            )}
            {item.status === 'lost' && (<>
              <button onClick={() => updateStatus('returned')} disabled={updating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                Mark as Returned
              </button>
              <button onClick={() => updateStatus('registered')} disabled={updating}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-60 transition-colors">
                Cancel — Not Lost
              </button>
            </>)}
            {item.status === 'found' && (<>
              <button onClick={() => updateStatus('returned')} disabled={updating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                Mark as Returned
              </button>
              <button onClick={() => updateStatus('lost')} disabled={updating}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-60 transition-colors">
                Still Missing
              </button>
            </>)}
            {item.status === 'returned' && (
              <button onClick={() => updateStatus('registered')} disabled={updating}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-60 transition-colors">
                Reactivate
              </button>
            )}
          </div>
        </div>

        {/* QR Code section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">QR Code</h3>
          <QRDisplay token={item.qr_token} itemName={item.name} />
        </div>

        {/* Scan history */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Scan History</h3>
          {scans.length === 0 ? (
            <p className="text-gray-400 text-sm">No scans yet.</p>
          ) : (
            <>
              <ScanMap scans={scans} />
              <div className="mt-4 space-y-3">
                {scans.map((scan, i) => (
                  <div key={scan.id}
                    className={`p-3 rounded-xl border text-sm ${i === 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                    {i === 0 && <div className="text-xs font-semibold text-amber-600 mb-1">Most recent</div>}
                    <div className="font-medium text-gray-700">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </div>
                    {scan.full_address && (
                      <div className="text-gray-500 mt-0.5">{scan.full_address}</div>
                    )}
                    <div className="text-gray-400 mt-0.5 text-xs">
                      Source: {scan.location_source === 'gps' ? '📍 GPS' : scan.location_source === 'ip' ? '🌐 IP geolocation' : 'Unknown'}
                      {scan.accuracy_meters && ` · ±${Math.round(scan.accuracy_meters)}m`}
                    </div>
                    {scan.latitude && scan.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline text-xs mt-1 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-2xl p-4">
          <h3 className="font-semibold text-red-700 text-sm mb-2">Danger Zone</h3>
          <button onClick={deleteItem}
            className="text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Delete item
          </button>
        </div>
      </div>
    </div>
  )
}
