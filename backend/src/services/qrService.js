/**
 * QR payload helpers for OPD token slips.
 * Encodes ONLY sessionId / tokenNumber — never clinical data.
 */
function buildTokenPayload({ sessionId, tokenNumber }) {
  return JSON.stringify({
    t: tokenNumber,
    s: String(sessionId),
    v: 1
  });
}

function parseTokenPayload(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || (!data.t && !data.s)) return null;
    return { tokenNumber: data.t, sessionId: data.s, version: data.v || 1 };
  } catch {
    return null;
  }
}

/**
 * Minimal SVG QR-like matrix for demo (deterministic from token string).
 * Production should swap for `qrcode` npm package PNG/SVG.
 */
function generateQrSvgDataUri(payload, size = 160) {
  const text = typeof payload === 'string' ? payload : buildTokenPayload(payload);
  // Simple hash → pseudo modules for visual demo without new dependency
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  const modules = 21;
  const cell = size / modules;
  let rects = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const bit = (Math.abs(hash + x * 31 + y * 17) % 3) !== 0;
      const finder =
        (x < 7 && y < 7) ||
        (x >= modules - 7 && y < 7) ||
        (x < 7 && y >= modules - 7);
      if (bit || finder) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function buildPrintableTokenSlipHtml(session, qrDataUri) {
  const waitMins = session.triagePriority === 'emergency' ? 0 : session.triagePriority === 'urgent' ? 10 : 25;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>OPD Token</title>
<style>
body{font-family:monospace;width:280px;margin:0 auto;padding:12px;color:#000}
h1{font-size:22px;margin:0 0 8px;text-align:center}
.token{font-size:28px;font-weight:bold;text-align:center;letter-spacing:1px}
.meta{font-size:12px;margin:8px 0;line-height:1.4}
.qr{display:block;margin:12px auto;width:140px;height:140px}
.note{font-size:10px;text-align:center;margin-top:12px;border-top:1px dashed #000;padding-top:8px}
</style></head><body>
<h1>AIIA OPD Token</h1>
<div class="token">${session.tokenNumber}</div>
<div class="meta">
<strong>Name:</strong> ${session.patientName}<br/>
<strong>Dept:</strong> ${session.department || 'General'}<br/>
<strong>Approx wait:</strong> ~${waitMins} min<br/>
<strong>Priority:</strong> ${session.triagePriority || 'normal'}
</div>
<img class="qr" src="${qrDataUri}" alt="QR"/>
<div class="note">No clinical data on this slip. Show QR at doctor's desk.</div>
</body></html>`;
}

module.exports = {
  buildTokenPayload,
  parseTokenPayload,
  generateQrSvgDataUri,
  buildPrintableTokenSlipHtml
};
