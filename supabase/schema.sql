-- ============================================================
-- Lost & Found — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Profiles (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id)
             ON DELETE CASCADE PRIMARY KEY,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    UUID REFERENCES profiles(id)
              ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT CHECK (category IN (
                'electronics','bag','keys','wallet',
                'clothing','documents','other'
              )),
  photo_url   TEXT,
  qr_token    UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status      TEXT DEFAULT 'registered' CHECK (status IN (
                'registered','lost','found','returned'
              )),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Scan logs
CREATE TABLE IF NOT EXISTS scan_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id         UUID REFERENCES items(id)
                  ON DELETE CASCADE NOT NULL,
  scanned_at      TIMESTAMPTZ DEFAULT NOW(),
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  accuracy_meters FLOAT,
  location_source TEXT CHECK (
                    location_source IN ('gps','ip','none')
                  ),
  city            TEXT,
  country         TEXT,
  full_address    TEXT
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on items
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_profile" ON profiles;
CREATE POLICY "user_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_insert_own_profile" ON profiles;
CREATE POLICY "user_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_update_own_profile" ON profiles;
CREATE POLICY "user_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_own_items" ON items;
CREATE POLICY "owner_read_own_items" ON items
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_insert_items" ON items;
CREATE POLICY "owner_insert_items" ON items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_update_items" ON items;
CREATE POLICY "owner_update_items" ON items
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_delete_items" ON items;
CREATE POLICY "owner_delete_items" ON items
  FOR DELETE USING (auth.uid() = owner_id);

-- Scan logs
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_own_scanlogs" ON scan_logs;
CREATE POLICY "owner_read_own_scanlogs" ON scan_logs
  FOR SELECT USING (
    item_id IN (
      SELECT id FROM items WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_insert_scanlogs" ON scan_logs;
CREATE POLICY "public_insert_scanlogs" ON scan_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- STORAGE (run after creating bucket in UI)
-- ============================================================
-- After creating the 'item-photos' bucket in the Supabase UI:
-- The bucket should be set to Public with 5MB max file size.
-- Storage policies are managed via the Supabase dashboard.
