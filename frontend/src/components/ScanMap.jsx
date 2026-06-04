import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon (Leaflet + Vite issue)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const recentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function ScanMap({ scans }) {
  if (!scans || scans.length === 0) return null

  const validScans = scans.filter(s => s.latitude && s.longitude)
  if (validScans.length === 0) return <p className="text-gray-400 text-sm">No location data available for scans.</p>

  const center = [validScans[0].latitude, validScans[0].longitude]

  return (
    <MapContainer center={center} zoom={13} className="h-64 w-full rounded-xl border border-gray-200">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validScans.map((scan, i) => (
        <Marker
          key={scan.id}
          position={[scan.latitude, scan.longitude]}
          icon={i === 0 ? recentIcon : undefined}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{i === 0 ? '📍 Most Recent' : `Scan #${i + 1}`}</p>
              <p>{new Date(scan.scanned_at).toLocaleString()}</p>
              {scan.full_address && <p className="mt-1">{scan.full_address}</p>}
              <p className="mt-1 text-gray-500">
                Via {scan.location_source === 'gps' ? 'GPS' : scan.location_source === 'ip' ? 'IP geolocation' : 'unknown'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
