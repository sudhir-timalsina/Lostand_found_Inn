import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendFoundAlert({ ownerEmail, item, scan }) {
  const mapsUrl = scan.latitude && scan.longitude
    ? `https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`
    : null

  const accuracyText = scan.location_source === 'gps'
    ? `±${Math.round(scan.accuracy_meters ?? 0)} metres via GPS`
    : scan.location_source === 'ip'
    ? 'City-level via IP geolocation'
    : 'Location unavailable'

  const dashboardUrl = `${process.env.FRONTEND_URL}/items/${item.id}`
  const timeFormatted = new Date(scan.scanned_at).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background: #4f46e5; color: #fff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
    .body { padding: 28px 32px; }
    .row { margin-bottom: 14px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .value { font-size: 15px; color: #111827; margin-top: 2px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-top: 6px; }
    .btn-outline { background: transparent; color: #4f46e5; border: 1.5px solid #4f46e5; margin-left: 10px; }
    .footer { padding: 18px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📍 Your ${item.name} may have been found</h1>
      <p>Someone pressed "I Found This Item" on your QR code</p>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">Location</div>
        <div class="value">${scan.full_address || 'Location not available'}</div>
      </div>
      <div class="row">
        <div class="label">Time</div>
        <div class="value">${timeFormatted}</div>
      </div>
      <div class="row">
        <div class="label">Accuracy</div>
        <div class="value">${accuracyText}</div>
      </div>
      <div style="margin-top: 24px;">
        ${mapsUrl ? `<a href="${mapsUrl}" class="btn">View on Google Maps</a>` : ''}
        <a href="${dashboardUrl}" class="btn ${mapsUrl ? 'btn-outline' : ''}">Open your dashboard</a>
      </div>
    </div>
    <div class="footer">
      This person shared their location only. No personal details were collected from them.
    </div>
  </div>
</body>
</html>
`

  await transporter.sendMail({
    from: `Lost & Found <${process.env.GMAIL_USER}>`,
    to: ownerEmail,
    subject: `Your ${item.name} may have been found`,
    html,
  })
}
