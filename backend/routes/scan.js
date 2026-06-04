import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { reverseGeocode } from '../services/geocode.js'
import { sendFoundAlert } from '../services/email.js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GATED_MESSAGES = {
  registered: 'This item is registered but has not been reported lost by its owner.',
  found:      'This item has already been found.',
  returned:   'This item has been returned to its owner.',
}

// GET /api/scan/:token — public info for finder
router.get('/:token', async (req, res) => {
  const { token } = req.params

  const { data: item, error } = await supabase
    .from('items')
    .select('id, name, category, status')
    .eq('qr_token', token)
    .single()

  if (error || !item) {
    return res.status(404).json({ error: 'Item not found.' })
  }

  // Return only safe fields — never owner data
  res.json({
    name: item.name,
    category: item.category,
    status: item.status,
  })
})

// POST /api/scan/:token — finder presses button
router.post('/:token', async (req, res) => {
  const { token } = req.params
  const { latitude, longitude, accuracy, location_source } = req.body

  // Step 1 — fetch item
  const { data: item, error } = await supabase
    .from('items')
    .select('id, name, category, status, owner_id')
    .eq('qr_token', token)
    .single()

  if (error || !item) {
    return res.status(404).json({ error: 'Item not found.' })
  }

  // Step 2 — gate if not lost
  if (item.status !== 'lost') {
    return res.json({
      gated: true,
      message: GATED_MESSAGES[item.status] ?? 'This item is not currently marked as lost.',
    })
  }

  // Step 3 — proceed: geocode, log, update, email

  // Reverse geocode
  let city = null
  let country = null
  let full_address = null

  if (latitude && longitude) {
    const geo = await reverseGeocode(latitude, longitude)
    city = geo.city
    country = geo.country
    full_address = geo.full_address
  }

  // Insert scan log
  const { data: scan, error: scanError } = await supabase
    .from('scan_logs')
    .insert({
      item_id: item.id,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      accuracy_meters: accuracy ?? null,
      location_source: location_source || 'none',
      city,
      country,
      full_address,
    })
    .select()
    .single()

  if (scanError) {
    console.error('scan_logs insert error:', scanError)
    return res.status(500).json({ error: 'Failed to log scan.' })
  }

  // Update item status to found
  await supabase
    .from('items')
    .update({ status: 'found' })
    .eq('id', item.id)

  // Fetch owner email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', item.owner_id)
    .single()

  // Send email (don't block response on failure)
  if (profile?.email) {
    sendFoundAlert({
      ownerEmail: profile.email,
      item,
      scan,
    }).catch(err => console.error('Email send error:', err))
  }

  res.json({ success: true, message: 'Owner has been notified.' })
})

export default router
