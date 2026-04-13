import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketView() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ticket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '600px' }} aria-label="Smart Ticket Booking">
      <h1 className="mb-4" style={{ fontSize: '1.6rem' }}>Get Your Smart Ticket</h1>

      {!ticket ? (
        <section className="glass-panel" aria-labelledby="ticket-form-heading">
          <h2 id="ticket-form-heading" className="text-muted mb-4" style={{ fontSize: '1rem', fontWeight: 400 }}>
            Enter your details to receive a gate-assigned QR pass
          </h2>
          <form onSubmit={generateTicket} noValidate>
            <div>
              <label htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                type="text"
                placeholder="e.g. Gopal MD"
                required
                autoComplete="name"
                aria-required="true"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="gopal@example.com"
                required
                autoComplete="email"
                aria-required="true"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? 'Generating...' : '🎫 Generate Smart Ticket'}
            </button>
          </form>
        </section>
      ) : (
        <section className="glass-panel ticket-card" aria-label="Your Ticket" aria-live="polite">
          <h2 className="mb-2">✅ Ticket Confirmed!</h2>
          <p className="text-muted mb-4">Show this QR code at your assigned gate.</p>

          <div className="qr-wrapper" role="img" aria-label={`QR Code for ticket ${ticket.ticketId}`}>
            <QRCodeSVG value={ticket.ticketId} size={200} />
          </div>

          <dl className="grid text-left" style={{ textAlign: 'left', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <dt><small className="text-muted">Name</small></dt>
              <dd><strong>{ticket.name}</strong></dd>
            </div>
            <div>
              <dt><small className="text-muted">Ticket ID</small></dt>
              <dd><strong>{ticket.ticketId}</strong></dd>
            </div>
            <div>
              <dt><small className="text-muted">Assigned Gate</small></dt>
              <dd><strong style={{ color: 'var(--warning)' }}>{ticket.gate}</strong></dd>
            </div>
            <div>
              <dt><small className="text-muted">Seat No.</small></dt>
              <dd><strong>{ticket.seatNumber}</strong></dd>
            </div>
          </dl>

          <button className="btn-secondary mt-4" onClick={() => setTicket(null)} style={{ width: '100%' }} aria-label="Book another ticket">
            Generate Another Ticket
          </button>
        </section>
      )}
    </main>
  );
}
