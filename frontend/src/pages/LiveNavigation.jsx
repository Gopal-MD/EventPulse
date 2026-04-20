import { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Users } from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Famous Indian Cricket Grounds with real stadium coordinates
const INDIAN_STADIUMS = [
  {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    lat: 18.9388,
    lng: 72.8254,
    capacity: '33,108',
    gateCoords: {
      'Gate 1': { lat: 18.93945, lng: 72.8254 },
      'Gate 2': { lat: 18.9388, lng: 72.82605 },
      'Gate 3': { lat: 18.93815, lng: 72.8254 },
      'Gate 4': { lat: 18.9388, lng: 72.82475 }
    }
  },
  {
    name: 'Eden Gardens',
    city: 'Kolkata',
    lat: 22.5645,
    lng: 88.3433,
    capacity: '68,000',
    gateCoords: {
      'Gate 1': { lat: 22.56515, lng: 88.3433 },
      'Gate 2': { lat: 22.5645, lng: 88.34395 },
      'Gate 3': { lat: 22.56385, lng: 88.3433 },
      'Gate 4': { lat: 22.5645, lng: 88.34265 }
    }
  },
  {
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    lat: 12.9789,
    lng: 77.5998,
    capacity: '38,000',
    gateCoords: {
      'Gate 1': { lat: 12.97955, lng: 77.5998 },
      'Gate 2': { lat: 12.9789, lng: 77.60045 },
      'Gate 3': { lat: 12.97825, lng: 77.5998 },
      'Gate 4': { lat: 12.9789, lng: 77.59915 }
    }
  },
  {
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    lat: 23.0911,
    lng: 72.5856,
    capacity: '1,32,000',
    gateCoords: {
      'Gate 1': { lat: 23.09195, lng: 72.5856 },
      'Gate 2': { lat: 23.0911, lng: 72.58645 },
      'Gate 3': { lat: 23.09025, lng: 72.5856 },
      'Gate 4': { lat: 23.0911, lng: 72.58475 }
    }
  },
  {
    name: 'MA Chidambaram Stadium',
    city: 'Chennai',
    lat: 13.0627,
    lng: 80.2791,
    capacity: '50,000',
    gateCoords: {
      'Gate 1': { lat: 13.06345, lng: 80.2791 },
      'Gate 2': { lat: 13.0627, lng: 80.27985 },
      'Gate 3': { lat: 13.06195, lng: 80.2791 },
      'Gate 4': { lat: 13.0627, lng: 80.27835 }
    }
  }
];

const STATIC_MAPS_KEY = import.meta.env.VITE_MAPS_API_KEY;

export default function LiveNavigation() {
  const [data, setData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState('');
  const [mapsKey, setMapsKey] = useState(STATIC_MAPS_KEY || '');
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const fetchInFlight = useRef(false);

  const stadium = INDIAN_STADIUMS[selectedIdx];

  // Load runtime config (Cloud Run friendly) and fallback to static Vite env
  useEffect(() => {
    let active = true;
    async function loadRuntimeConfig() {
      try {
        const res = await fetch('/api/config');
        const cfg = await res.json();
        if (active && cfg?.mapsApiKey) {
          setMapsKey(cfg.mapsApiKey);
        }
      } catch (err) {
        // Silent fallback: keep STATIC_MAPS_KEY when config endpoint is unavailable
        console.warn('[MapConfig] Runtime config unavailable, using static key if present.');
      }
    }
    loadRuntimeConfig();
    return () => {
      active = false;
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapsKey) {
      setMapError('Google Maps key is missing. Showing live status without map tiles.');
      return;
    }

    let mounted = true;

    async function initMap() {
      try {
        setOptions({ apiKey: mapsKey, version: 'weekly' });
        const { Map } = await importLibrary('maps');
        await importLibrary('marker');

        if (!mounted || !mapRef.current) return;

        const newMap = new Map(mapRef.current, {
          center: { lat: stadium.lat, lng: stadium.lng },
          zoom: 17,
          mapTypeId: 'satellite',
          disableDefaultUI: true,
          zoomControl: true,
          mapId: 'DEMO_MAP_ID'
        });

        setMap(newMap);
        setMapError('');
      } catch (err) {
        console.error('[MapLoader]', err);
        setMapError('Map unavailable right now. Live gate data is still active.');
      }
    }

    initMap();

    return () => {
      mounted = false;
    };
  }, [mapsKey]);

  // Sync Map center when stadium changes
  useEffect(() => {
    if (map) {
      map.setCenter({ lat: stadium.lat, lng: stadium.lng });
    }
  }, [selectedIdx, map]);

  // Handle markers and scaling updates
  useEffect(() => {
    if (!map || !data) return;

    const google = window.google;
    
    // Cleanup old markers if stadium changed (implied by markersRef check)
    Object.keys(stadium.gateCoords).forEach(gate => {
      const info = data.gates[gate];
      if (!info) return;

      let color = '#10b981'; // green
      if (info.status === 'Medium') color = '#f59e0b';
      if (info.status === 'High') color = '#ef4444';

      if (!markersRef.current[gate]) {
        // Create new marker
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.innerHTML = `
          <div class="marker-pulse" style="background: ${color}33; border: 2px solid ${color};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="marker-label" style="color: ${color}">
            <span class="marker-name">${gate}</span>
            <span class="marker-status">${info.status}</span>
          </div>
        `;

        const AdvancedMarker = google?.maps?.marker?.AdvancedMarkerElement;
        if (AdvancedMarker) {
          markersRef.current[gate] = new AdvancedMarker({
            map,
            position: stadium.gateCoords[gate],
            title: gate,
            content: markerElement
          });
        }
      } else {
        // Update existing marker color/position
        markersRef.current[gate].position = stadium.gateCoords[gate];
        const el = markersRef.current[gate].content;
        el.querySelector('.marker-pulse').style.background = `${color}33`;
        el.querySelector('.marker-pulse').style.border = `2px solid ${color}`;
        el.querySelector('svg').setAttribute('stroke', color);
        el.querySelector('.marker-label').style.color = color;
        el.querySelector('.marker-name').innerText = gate;
        el.querySelector('.marker-status').innerText = info.status;
      }
    });

  }, [data, map, stadium]);

  const fetchState = async () => {
    if (fetchInFlight.current) return;
    if (document.hidden) return;
    fetchInFlight.current = true;
    try {
      const res = await fetch('/api/state');
      const state = await res.json();
      setData(state);
    } catch (err) {
      console.error(err);
    } finally {
      fetchInFlight.current = false;
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  let bestStall = null;
  if (data?.foodQueues) {
    bestStall = data.foodQueues.reduce((prev, curr) => prev.waitTime < curr.waitTime ? prev : curr);
  }

  return (
    <main className="container" aria-label="Live Stadium Navigation">
      <style>{`
        .custom-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transform: translate(-50%, -100%);
          transform-origin: bottom center;
          pointer-events: none;
        }
        .marker-pulse { 
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .marker-label {
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(4px);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
          text-align: center;
          line-height: 1.1;
          min-width: 80px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .marker-name { display: block; }
        .marker-status { display: block; font-size: 0.66rem; font-weight: 600; opacity: 0.95; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem', margin: 0 }}>
            <MapPin size={28} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            Live Stadium Map (Interactive)
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
            onChange={e => {
              // Clear markers when stadium changes
              Object.values(markersRef.current).forEach(m => m.map = null);
              markersRef.current = {};
              setSelectedIdx(Number(e.target.value));
            }}
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
        <section className="glass-panel" role="alert" aria-live="assertive" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Navigation size={22} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <strong style={{ color: 'var(--danger)' }}>Smart AR Reroute Alert</strong>
              <p style={{ marginTop: '4px', color: '#fca5a5' }}>{data.alerts[0].message}</p>
            </div>
          </div>
        </section>
      )}

      {mapError && (
        <section className="glass-panel" role="status" aria-live="polite" style={{ marginBottom: '12px', border: '1px solid var(--warning)' }}>
          <p style={{ color: 'var(--warning)', margin: 0 }}>{mapError}</p>
        </section>
      )}

      {/* Interactive Map Container */}
      <section 
        aria-label="Interactive Stadium Map" 
        style={{
          width: '100%',
          height: '480px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        {/* Waterfall Watermark */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '16px',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          borderRadius: '8px', padding: '6px 14px',
          color: 'white', fontSize: '0.85rem', fontWeight: 600, pointerEvents: 'none'
        }}>
          📍 Interactive Professional View
        </div>
      </section>

      {/* Gate Status Cards + Legend */}
      <section className="grid mt-4" aria-label="Stadium Status Details">
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

        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Legend</h2>
          <ul style={{ listStyle: 'none', lineHeight: '2', padding: 0 }}>
            <li><span style={{ color: '#10b981', fontSize: '1.4rem' }} aria-hidden="true">●</span> Low — <span className="text-muted">Enter freely</span></li>
            <li><span style={{ color: '#f59e0b', fontSize: '1.4rem' }} aria-hidden="true">●</span> Medium — <span className="text-muted">Minor delay</span></li>
            <li><span style={{ color: '#ef4444', fontSize: '1.4rem' }} aria-hidden="true">●</span> High — <span className="text-muted">Avoid! Use alternate</span></li>
          </ul>
        </div>

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
