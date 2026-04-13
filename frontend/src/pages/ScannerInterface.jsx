import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

/**
 * ScannerInterface — Coordinator Entry Validation Page
 * Supports: camera QR scanning + manual ticket ID entry
 * Security: all validation done server-side; no client-side trust
 * Accessibility: ARIA live regions, semantic HTML, keyboard-friendly
 */
export default function ScannerInterface() {
  const [ticketId, setTicketId]     = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [camError, setCamError]     = useState('');

  const videoRef   = useRef(null);
  const scannerRef = useRef(null);

  // Cleanup camera on unmount
  useEffect(() => { return () => stopScanner(); }, []);

  const startScanner = () => {
    setCamError('');
    setIsScanning(true);
    setTimeout(() => {
      if (!videoRef.current) return;
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const code = result?.data || result;
          if (code) {
            setTicketId(code);
            stopScanner();
            processScan(code);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 25,
          returnDetailedScanResult: true
        }
      );
      scannerRef.current.start().catch((err) => {
        console.error('[Scanner]', err);
        setCamError('Camera access denied. Please use manual entry below.');
        stopScanner();
      });
    }, 10);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const processScan = async (id) => {
    // Basic client-side guard (server validates authoritatively)
    if (!id || id.trim().length < 3) {
      setScanResult({ error: 'Invalid ticket ID format' });
      return;
    }
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/ticket/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id.trim() })
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error('[ProcessScan]', err);
      setScanResult({ error: 'Failed to connect to server. Please retry.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    processScan(ticketId);
  };

  return (
    <main className="container" style={{ maxWidth: '620px' }} aria-label="Coordinator Entry Scanner">
      <h1 className="mb-4" style={{ fontSize: '1.6rem' }}>📷 Entry Validator</h1>

      <section className="glass-panel text-center" aria-labelledby="scanner-heading">
        <h2 id="scanner-heading" className="text-muted mb-4" style={{ fontSize: '1rem', fontWeight: 400 }}>
          Scan a QR code with your camera, or enter a Ticket ID below
        </h2>

        {/* Camera scanner area */}
        {isScanning ? (
          <div
            role="region"
            aria-label="Live camera QR scanner"
            style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}
          >
            <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
              Hold QR code steady, 6–8 inches from camera
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              aria-label="Camera feed for QR code scanning"
              style={{ width: '100%', borderRadius: '8px' }}
            />
            <button
              className="btn-secondary mt-3"
              onClick={stopScanner}
              aria-label="Stop camera and cancel QR scan"
            >
              ✕ Cancel Scan
            </button>
          </div>
        ) : (
          <>
            <button
              id="start-camera-btn"
              className="btn-primary mb-4"
              onClick={startScanner}
              disabled={loading}
              aria-label="Activate camera for QR code scanning"
            >
              📷 Start Camera Scan
            </button>

            {camError && (
              <p role="alert" style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.875rem' }}>
                {camError}
              </p>
            )}

            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>— or manually enter Ticket ID —</p>

            <form onSubmit={handleManualScan} noValidate>
              <label htmlFor="ticket-id-input" className="text-muted" style={{ display: 'block', marginBottom: '4px' }}>
                Ticket ID
              </label>
              <input
                id="ticket-id-input"
                type="text"
                placeholder="TKT-XXXXXX"
                required
                aria-required="true"
                autoComplete="off"
                value={ticketId}
                onChange={e => setTicketId(e.target.value.toUpperCase())}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
              />
              <button
                className="btn-primary"
                type="submit"
                disabled={loading || !ticketId.trim()}
                aria-busy={loading}
                aria-label="Validate the entered ticket ID"
              >
                {loading ? 'Validating...' : '✅ Validate Entry'}
              </button>
            </form>
          </>
        )}

        {/* Scan result — live region so screen readers announce it */}
        <div aria-live="assertive" aria-atomic="true">
          {scanResult && (
            <div
              role="alert"
              className={`alert mt-4 ${scanResult.success ? '' : 'danger'}`}
              style={scanResult.success
                ? { background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', color: '#6ee7b7' }
                : {}
              }
            >
              {scanResult.success ? (
                <dl style={{ textAlign: 'left', width: '100%', margin: 0 }}>
                  <h3 style={{ color: 'var(--success)', marginBottom: '10px' }}>{scanResult.message} ✅</h3>
                  <div><dt><strong>Name</strong></dt><dd>{scanResult.ticket.name}</dd></div>
                  <div><dt><strong>Gate</strong></dt><dd>{scanResult.ticket.gate}</dd></div>
                  <div><dt><strong>Seat</strong></dt><dd>{scanResult.ticket.seatNumber}</dd></div>
                </dl>
              ) : (
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <h3 aria-label="Access denied">Access Denied ❌</h3>
                  <p>{scanResult.error || scanResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
