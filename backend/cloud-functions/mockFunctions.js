function validateQrScanCloudFn({ ticketId, qrToken, expectedToken }) {
  if (!ticketId || !/^TKT-[A-Z0-9]{6,12}$/.test(ticketId)) {
    return { ok: false, reason: 'Invalid ticket ID format' };
  }

  if (qrToken && expectedToken && qrToken !== expectedToken) {
    return { ok: false, reason: 'QR token validation failed' };
  }

  return { ok: true };
}

function buildAlertCloudFn({ gate, alternate }) {
  return {
    id: Date.now(),
    message: `[CloudFn] ${gate} is highly crowded. Suggested alternate: ${alternate}.`,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  validateQrScanCloudFn,
  buildAlertCloudFn,
};
