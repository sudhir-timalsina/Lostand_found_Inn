import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRDisplay({ token, itemName }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    if (!token) return
    const url = `${window.location.origin}/scan/${token}`
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setDataUrl)
  }, [token])

  function handleDownload() {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `qr-${itemName ?? 'item'}.png`
    link.href = dataUrl
    link.click()
  }

  if (!dataUrl) return <div className="text-gray-400 text-sm">Generating QR code…</div>

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={dataUrl} alt="QR Code" className="rounded-lg border border-gray-200" />
      <button
        onClick={handleDownload}
        className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        ⬇ Download QR as PNG
      </button>
      <p className="text-xs text-gray-400 text-center">
        Print or attach this QR code to your item.
        <br />Anyone who finds it can scan it to alert you.
      </p>
    </div>
  )
}
