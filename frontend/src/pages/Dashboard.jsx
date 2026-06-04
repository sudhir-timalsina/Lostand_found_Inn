import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'

const API_URL = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkSessionAndLoad()
  }, [])

  async function checkSessionAndLoad() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    await loadItems(session.access_token)
  }

  async function loadItems(token) {
    try {
      const res = await fetch(`${API_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load items')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const counts = {
    total: items.length,
    lost: items.filter(i => i.status === 'lost').length,
    found: items.filter(i => i.status === 'found').length,
    returned: items.filter(i => i.status === 'returned').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
          <Link
            to="/items/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Register New Item
          </Link>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: counts.total, color: 'text-gray-900' },
            { label: 'Lost', value: counts.lost, color: 'text-red-600' },
            { label: 'Found', value: counts.found, color: 'text-amber-600' },
            { label: 'Returned', value: counts.returned, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-16">Loading your items…</div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-lg font-medium text-gray-600">No items yet</p>
            <p className="text-sm mt-1">Register your first item to get a QR code.</p>
            <Link
              to="/items/new"
              className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Register New Item
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
