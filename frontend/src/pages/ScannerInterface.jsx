import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

export default function ScannerInterface() {
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const startScanner = () => {
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
          maxScansPerSecond: 60,
          returnDetailedScanResult: true
        }
      );
      scannerRef.current.start().catch((err) => {
        console.error(err);
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
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/ticket/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id })
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error(err);
      setScanResult({ error: "Failed to connect to server" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    processScan(ticketId);
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Coordinator Entry Scanner</h2>
      
      <div className="glass-panel text-center">
        <p className="text-muted mb-4">Validate QR Code via Camera or Ticket ID</p>
        
        {isScanning ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}>
            <video ref={videoRef} style={{ width: '100%' }}></video>
            <button className="btn-secondary mt-3" onClick={stopScanner}>Cancel Scan</button>
          </div>
        ) : (
          <>
            <button className="btn-primary mb-4" onClick={startScanner} disabled={loading} style={{ background: 'var(--accent)' }}>
              📷 Start Camera Scan
            </button>
            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>OR manually enter ID</p>
            <form onSubmit={handleManualScan}>
              <input 
                type="text" 
                placeholder="Enter TKT-XXXXXX" 
                required 
                value={ticketId}
                onChange={e => setTicketId(e.target.value.toUpperCase())}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Validating...' : 'Validate Ticket ID'}
              </button>
            </form>
          </>
        )}

        {scanResult && (
          <div className={`alert mt-4 ${scanResult.success ? '' : 'danger'}`} style={scanResult.success ? { background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', color: '#6ee7b7' } : {}}>
            {scanResult.success ? (
              <div style={{ textAlign: 'left', width: '100%' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '10px' }}>{scanResult.message} ✅</h4>
                <p><strong>Name:</strong> {scanResult.ticket.name}</p>
                <p><strong>Gate:</strong> {scanResult.ticket.gate}</p>
                <p><strong>Seat:</strong> {scanResult.ticket.seatNumber}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'left', width: '100%' }}>
                <h4>Access Denied ❌</h4>
                <p>{scanResult.error || scanResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
