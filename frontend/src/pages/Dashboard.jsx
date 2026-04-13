import { useState, useEffect, useCallback } from 'react';

/**
 * Dashboard — Admin Live Control Center
 * Auto-polls /api/state every 3s for live gate density and alerts
 * Rule-based AI alerts are surfaced prominently with ARIA roles
 * Accessibility: semantic HTML, ARIA live regions, keyboard-friendly
 */
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [simBusy, setSimBusy] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res   = await fetch('/api/state');
      const state = await res.json();
      setData(state);
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const simulateCrowd = async () => {
    setSimBusy(true);
    try {
      await fetch('/api/simulate', { method: 'POST' });
      await fetchState();
    } finally {
      setSimBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="container text-center" aria-label="Loading dashboard">
        <p role="status" aria-live="polite">Loading live data...</p>
      </main>
    );
  }

  const totalEntries = data ? Object.values(data.tickets).filter(t => t.checkedIn).length : 0;
  const totalTickets = data ? Object.keys(data.tickets).length : 0;

  // Find quickest food stall
  const bestStall = data?.foodQueues?.length
    ? data.foodQueues.reduce((a, b) => a.waitTime < b.waitTime ? a : b)
    : null;

  return (
    <main className="container" aria-label="Live Control Center">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem' }}>📊 Live Control Center</h1>
        <button
          className="btn-secondary"
          onClick={simulateCrowd}
          disabled={simBusy}
          aria-busy={simBusy}
          aria-label="Force a simulated crowd density change across all gates"
          style={{ width: 'auto' }}
        >
          {simBusy ? 'Simulating...' : '🎲 Simulate Crowd Change'}
        </button>
      </div>

      {/* Reroute Alerts — assertive ARIA so screen readers announce immediately */}
      <section aria-live="assertive" aria-atomic="false" aria-label="Active rerouting alerts">
        {data?.alerts?.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2" style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>
              ⚠️ Active Reroute Alerts
            </h2>
            {data.alerts.map((alert, i) => (
              <div key={i} role="alert" className="alert danger">
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <div className="grid mb-4">

        {/* Total Entries */}
        <article className="glass-panel text-center" aria-label={`${totalEntries} attendees checked in of ${totalTickets} tickets issued`}>
          <h2 className="text-muted" style={{ fontSize: '1rem', fontWeight: 400 }}>Total Entries</h2>
          <p
            style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)', lineHeight: 1.2, margin: '8px 0' }}
            aria-label={`${totalEntries} checked in`}
          >
            {totalEntries}
          </p>
          <p className="text-muted">/ {totalTickets} Tickets Issued</p>
        </article>

        {/* Food Queue */}
        <article className="glass-panel" aria-label="Food stall wait times">
          <h2 style={{ marginBottom: '16px', fontSize: '1rem' }}>🍔 Food Queue Wait Times</h2>
          {bestStall && (
            <p style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--success)' }}>
              ⚡ Quickest: <strong>{bestStall.name}</strong> — {bestStall.waitTime} min
            </p>
          )}
          <ul role="list" style={{ listStyle: 'none' }}>
            {data?.foodQueues?.map(food => {
              const color = food.waitTime < 10 ? 'var(--success)' : food.waitTime > 20 ? 'var(--danger)' : 'var(--warning)';
              return (
                <li
                  key={food.id}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}
                  aria-label={`${food.name}: ${food.waitTime} minute wait`}
                >
                  <span>{food.name}</span>
                  <span style={{ color, fontWeight: 'bold' }}>{food.waitTime} mins</span>
                </li>
              );
            })}
          </ul>
        </article>
      </div>

      {/* Gate Crowd Density */}
      <section aria-labelledby="gate-density-heading" aria-live="polite">
        <h2 id="gate-density-heading" className="mb-2" style={{ fontSize: '1.1rem' }}>Gate Crowd Density</h2>
        <div className="grid">
          {data && Object.entries(data.gates).map(([gate, info]) => (
            <article
              key={gate}
              className="glass-panel text-center"
              aria-label={`${gate}: crowd level ${info.crowdLevel}, status ${info.status}`}
            >
              <h3 style={{ fontSize: '1rem' }}>{gate}</h3>
              <p
                style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight: 'bold' }}
                aria-label={`Crowd count: ${info.crowdLevel}`}
              >
                {info.crowdLevel}
              </p>
              <span
                className={`badge ${info.status.toLowerCase()}`}
                role="status"
                aria-label={`Status: ${info.status} density`}
              >
                {info.status} Density
              </span>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
