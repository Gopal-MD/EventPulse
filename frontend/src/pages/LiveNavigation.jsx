import { useState, useEffect } from 'react';
import { Navigation, MapPin, Users } from 'lucide-react';

// Famous Indian Cricket Grounds with real stadium coordinates
const INDIAN_STADIUMS = [
  {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    lat: 18.9388,
    lng: 72.8254,
    capacity: '33,108',
    gates: {
      'Gate 1': { top: '8%', left: '50%' },
      'Gate 2': { top: '50%', left: '92%' },
      'Gate 3': { top: '90%', left: '50%' },
      'Gate 4': { top: '50%', left: '8%' }
    }
  },
  {
    name: 'Eden Gardens',
    city: 'Kolkata',
    lat: 22.5645,
    lng: 88.3433,
    capacity: '68,000',
    gates: {
      'Gate 1': { top: '8%', left: '40%' },
      'Gate 2': { top: '40%', left: '92%' },
      'Gate 3': { top: '92%', left: '60%' },
      'Gate 4': { top: '60%', left: '8%' }
    }
  },
  {
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    lat: 12.9789,
    lng: 77.5998,
    capacity: '38,000',
    gates: {
      'Gate 1': { top: '8%', left: '50%' },
      'Gate 2': { top: '50%', left: '92%' },
      'Gate 3': { top: '90%', left: '50%' },
      'Gate 4': { top: '50%', left: '8%' }
    }
  },
  {
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    lat: 23.0900,
    lng: 72.0856,
    capacity: '1,32,000',
    gates: {
      'Gate 1': { top: '5%', left: '50%' },
      'Gate 2': { top: '50%', left: '95%' },
      'Gate 3': { top: '93%', left: '50%' },
      'Gate 4': { top: '50%', left: '5%' }
    }
  },
  {
    name: 'MA Chidambaram Stadium',
    city: 'Chennai',
    lat: 13.0627,
    lng: 80.2791,
    capacity: '50,000',
    gates: {
      'Gate 1': { top: '8%', left: '48%' },
      'Gate 2': { top: '48%', left: '92%' },
      'Gate 3': { top: '90%', left: '52%' },
      'Gate 4': { top: '52%', left: '8%' }
    }
  }
];

const MAPS_KEY = import.meta.env.VITE_MAPS_API_KEY;

export default function LiveNavigation() {
  const [data, setData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const stadium = INDIAN_STADIUMS[selectedIdx];

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${stadium.lat},${stadium.lng}&zoom=17&size=900x480&maptype=satellite&key=${MAPS_KEY}`;

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const state = await res.json();
      setData(state);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  // Find lowest wait time stall
  let bestStall = null;
  if (data?.foodQueues) {
    bestStall = data.foodQueues.reduce((prev, curr) => prev.waitTime < curr.waitTime ? prev : curr);
  }

  const gateLayout = stadium.gates;

  return (
    <main className="container" aria-label="Live Stadium Navigation">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem', margin: 0 }}>
            <MapPin size={28} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            Live Stadium Map
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            {stadium.name} · {stadium.city} · Capacity: {stadium.capacity}
          </p>
        </div>
        {/* Stadium Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="stadium-selector" className="text-muted" style={{ fontSize: '0.8rem' }}>Change Stadium</label>
          <select
            id="stadium-selector"
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            style={{ width: 'auto', marginBottom: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
          >
            {INDIAN_STADIUMS.map((s, i) => (
              <option key={i} value={i} style={{ background: '#0b0f19' }}>
                {s.name}, {s.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AR Alert Banner */}
      {data?.alerts && data.alerts.length > 0 && (
        <section 
          className="glass-panel" 
          role="alert" 
          aria-live="assertive" 
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', marginBottom: '20px', padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Navigation size={22} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <strong style={{ color: 'var(--danger)' }}>Smart AR Reroute Alert</strong>
              <p style={{ marginTop: '4px', color: '#fca5a5' }}>{data.alerts[0].message}</p>
            </div>
          </div>
        </section>
      )}

      {/* Satellite Map with Gate Overlays */}
      <section 
        aria-label="Interactive Stadium Map" 
        style={{
          position: 'relative',
          width: '100%',
          height: '480px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Real Google Satellite Map */}
        <img
          src={mapUrl}
          alt={`Satellite view of ${stadium.name} in ${stadium.city}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Dark overlay for better dot visibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} aria-hidden="true" />

        {/* Stadium Name Watermark */}
        <div style={{
          position: 'absolute', bottom: '14px', left: '16px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: '8px', padding: '6px 14px',
          color: 'white', fontSize: '0.85rem', fontWeight: 600
        }}>
          📍 {stadium.name}, {stadium.city}
        </div>

        {/* Powered by Google */}
        <div style={{
          position: 'absolute', bottom: '14px', right: '16px',
          background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '4px 10px',
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)'
        }}>
          Powered by Google Maps
        </div>

        {/* Gate Dots Overlay */}
        <div aria-label="Gate status markers" role="group">
          {data && Object.keys(data.gates).map(gate => {
            const info = data.gates[gate];
            const pos = gateLayout[gate];
            if (!pos) return null;

            let color = '#10b981'; // green
            if (info.status === 'Medium') color = '#f59e0b';
            if (info.status === 'High') color = '#ef4444';

            return (
              <div 
                key={gate} 
                role="status" 
                aria-label={`${gate} crowd status: ${info.status}`}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 10
                }}
              >
                {/* Pulsing outer ring */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: `${color}33`,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 20px ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: info.status === 'High' ? 'blink 0.8s infinite' : 'none'
                }}>
                  <Users size={16} color={color} aria-hidden="true" />
                </div>
                {/* Gate Label */}
                <div style={{
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                  borderRadius: '6px', padding: '2px 8px',
                  fontSize: '0.7rem', fontWeight: 'bold', color: color,
                  whiteSpace: 'nowrap'
                }}>
                  {gate} · {info.status}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gate Status Cards + Best Stall */}
      <section className="grid mt-4" aria-label="Stadium Status Details">
        {/* Gate Status */}
        <div className="glass-panel" aria-live="polite">
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Gate Status</h2>
          {data && Object.keys(data.gates).map(gate => {
            const info = data.gates[gate];
            return (
              <div key={gate} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
                <span style={{ fontWeight: 600 }}>{gate}</span>
                <span className={`badge ${info.status.toLowerCase()}`} role="status">{info.status}</span>
              </div>
            );
          })}
        </div>

        {/* Map Legend */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Legend</h2>
          <ul style={{ listStyle: 'none', lineHeight: '2', padding: 0 }}>
            <li><span style={{ color: '#10b981', fontSize: '1.4rem' }} aria-hidden="true">●</span> Low — <span className="text-muted">Enter freely</span></li>
            <li><span style={{ color: '#f59e0b', fontSize: '1.4rem' }} aria-hidden="true">●</span> Medium — <span className="text-muted">Minor delay</span></li>
            <li><span style={{ color: '#ef4444', fontSize: '1.4rem' }} aria-hidden="true">●</span> High — <span className="text-muted">Avoid! Use alternate</span></li>
          </ul>
        </div>

        {/* Best Food Stall */}
        {bestStall && (
          <article className="glass-panel" style={{ borderLeft: '4px solid var(--success)' }} aria-label="Dynamic Food Recommendation">
            <h2 style={{ fontSize: '1.1rem' }}>⚡ Quickest Food Stall</h2>
            <p style={{ fontSize: '1.2rem', marginTop: '12px' }}><strong>{bestStall.name}</strong></p>
            <p className="text-muted">Only {bestStall.waitTime} min wait right now!</p>
          </article>
        )}
      </section>
    </main>
  );
}
