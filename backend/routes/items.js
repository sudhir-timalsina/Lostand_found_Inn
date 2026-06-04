import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// GET /api/items — list owner's items
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Attach last scan time
  const itemsWithScans = await Promise.all(
    data.map(async item => {
      const { data: scans } = await supabase
        .from('scan_logs')
        .select('scanned_at')
        .eq('item_id', item.id)
        .order('scanned_at', { ascending: false })
        .limit(1)
      return { ...item, last_scan: scans?.[0]?.scanned_at ?? null }
    })
  )

  res.json(itemsWithScans)
})

// POST /api/items — create item
router.post('/', requireAuth, async (req, res) => {
  const { name, description, category, photo_url } = req.body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Item name is required.' })
  }

  const validCategories = ['electronics','bag','keys','wallet','clothing','documents','other']
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ error: 'Valid category is required.' })
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      category,
      photo_url: photo_url || null,
      owner_id: req.user.id,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH /api/items/:id — update item
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { name, description, category, photo_url, status } = req.body

  const validStatuses = ['registered','lost','found','returned']
  const validCategories = ['electronics','bag','keys','wallet','clothing','documents','other']

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' })
  }
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' })
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('items')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (!existing || existing.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const updates = {}
  if (name !== undefined) updates.name = name.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (category !== undefined) updates.category = category
  if (photo_url !== undefined) updates.photo_url = photo_url
  if (status !== undefined) updates.status = status

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/items/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params

  const { data: existing } = await supabase
    .from('items')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (!existing || existing.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// GET /api/items/:id/scans — scan history for an item
router.get('/:id/scans', requireAuth, async (req, res) => {
  const { id } = req.params

  // Verify ownership
  const { data: item } = await supabase
    .from('items')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (!item || item.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('item_id', id)
    .order('scanned_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
