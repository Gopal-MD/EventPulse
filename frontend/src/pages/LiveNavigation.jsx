import { useState, useEffect } from 'react';
import { Navigation } from 'lucide-react'; // AR Bonus icon

export default function LiveNavigation() {
  const [data, setData] = useState(null);

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

  // Simplified Map Layout Mapping
  const mapLayout = {
    'Gate 1': { top: '10%', left: '50%' },
    'Gate 2': { top: '50%', left: '90%' },
    'Gate 3': { top: '90%', left: '50%' },
    'Gate 4': { top: '50%', left: '10%' }
  };

  // Find lowest wait time stall
  let bestStall = null;
  if (data?.foodQueues) {
    bestStall = data.foodQueues.reduce((prev, curr) => prev.waitTime < curr.waitTime ? prev : curr);
  }

  return (
    <div className="container">
      <h2>Live Stadium Overview</h2>
      <p className="text-muted mb-4">Real-time gate and facility coordination.</p>

      {/* Bonus: Simple AR-like directional arrows simulated as a banner UI */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="glass-panel text-center" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <Navigation size={24} className="ar-pulse" /> Mock AR Directions active
          </h3>
          <p>{data.alerts[0].message}</p>
        </div>
      )}

      <div className="map-container" style={{
        backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=53.4631,-2.2913&zoom=17&size=800x450&maptype=satellite&key=${import.meta.env.VITE_MAPS_API_KEY}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1E293B',
        position: 'relative',
        height: '450px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Placeholder Stadium Map */}

        {data && Object.keys(data.gates).map(gate => {
          const info = data.gates[gate];
          let color = 'var(--success)';
          if (info.status === 'Medium') color = 'var(--warning)';
          if (info.status === 'High') color = 'var(--danger)';

          return (
             <div key={gate} className="gate-dot" style={{
               top: mapLayout[gate].top,
               left: mapLayout[gate].left,
               background: color,
               boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
               position: 'absolute',
               width: '24px',
               height: '24px',
               borderRadius: '50%',
               transform: 'translate(-50%, -50%)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               color: '#fff',
               fontSize: '10px',
               fontWeight: 'bold',
               animation: info.status === 'High' ? 'blink 1s infinite' : 'pulse 2s infinite'
             }}>
               {gate.split(' ')[1]}
             </div>
          );
        })}
      </div>

      <div className="grid mt-4">
        <div className="glass-panel">
          <h3>Map Legend</h3>
          <ul style={{ listStyle: 'none', marginTop: '10px' }}>
            <li><span style={{ color: 'var(--success)' }}>●</span> Low Crowd</li>
            <li><span style={{ color: 'var(--warning)' }}>●</span> Medium Crowd</li>
            <li><span style={{ color: 'var(--danger)' }}>●</span> High Crowd (Avoid)</li>
          </ul>
        </div>
        
        {bestStall && (
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--success)' }}>
             <h3>⚡ Quickest Bite</h3>
             <p className="mt-4" style={{ fontSize: '1.2rem' }}><strong>{bestStall.name}</strong></p>
             <p className="text-muted">Wait time: only {bestStall.waitTime} mins!</p>
          </div>
        )}
      </div>

    </div>
  );
}
