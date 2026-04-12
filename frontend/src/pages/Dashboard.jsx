import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const state = await res.json();
      setData(state);
    } catch (err) {
      console.error("Fetch state error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const simulateCrowd = async () => {
    await fetch('/api/simulate', { method: 'POST' });
    fetchState();
  };

  if (loading) return <div className="container text-center"><p>Loading live data...</p></div>;

  const totalEntries = data ? Object.values(data.tickets).filter(t => t.checkedIn).length : 0;
  const totalTickets = data ? Object.keys(data.tickets).length : 0;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Live Control Center</h2>
        <button className="btn-secondary" onClick={simulateCrowd} style={{ width: 'auto' }}>
          🎲 Force Simulate Crowd Change
        </button>
      </div>

      {data?.alerts && data.alerts.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2" style={{ color: 'var(--danger)' }}>Active Reroute Alerts</h3>
          {data.alerts.map((alert, i) => (
            <div key={i} className="alert danger">
              ⚠️ {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid mb-4">
        <div className="glass-panel text-center">
          <h3 className="text-muted">Total Entries</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totalEntries}</p>
          <p className="text-muted">/ {totalTickets} Tickets Issued</p>
        </div>
        
        <div className="glass-panel">
          <h3 className="mb-4">Food Queue Wait Times</h3>
          {data?.foodQueues.map(food => (
            <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
              <span>{food.name}</span>
              <span style={{ color: food.waitTime < 10 ? 'var(--success)' : food.waitTime > 20 ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold' }}>
                {food.waitTime} mins
              </span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="mb-2">Gate Crowd Density</h3>
      <div className="grid">
        {data && Object.keys(data.gates).map(gate => {
          const info = data.gates[gate];
          return (
            <div key={gate} className="glass-panel text-center">
              <h4>{gate}</h4>
              <p style={{ fontSize: '2rem', margin: '10px 0' }}>{info.crowdLevel}</p>
              <span className={`badge ${info.status.toLowerCase()}`}>{info.status} Density</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
