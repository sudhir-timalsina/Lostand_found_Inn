export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LostAndFound/1.0' },
    })
    if (!res.ok) return { city: null, country: null, full_address: null }
    const data = await res.json()
    const city = data.address?.city
      || data.address?.town
      || data.address?.village
      || data.address?.county
      || null
    const country = data.address?.country || null
    const full_address = data.display_name || null
    return { city, country, full_address }
  } catch {
    return { city: null, country: null, full_address: null }
  }
}
