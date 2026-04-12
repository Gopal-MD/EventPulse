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
    <div className="container" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Get Your Smart Ticket</h2>
      
      {!ticket ? (
        <div className="glass-panel">
          <form onSubmit={generateTicket}>
            <div>
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label>Email ID</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Smart Ticket'}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-panel ticket-card">
          <h3 className="mb-2">Ticket Generated successfully!</h3>
          <p className="text-muted mb-4">Your personalized entry pass.</p>
          
          <div className="qr-wrapper">
            <QRCodeSVG value={ticket.ticketId} size={200} />
          </div>
          
          <div className="grid text-left" style={{textAlign: 'left', gridTemplateColumns: '1fr 1fr'}}>
            <div>
              <small className="text-muted">Name</small>
              <p><strong>{ticket.name}</strong></p>
            </div>
            <div>
              <small className="text-muted">Ticket ID</small>
              <p><strong>{ticket.ticketId}</strong></p>
            </div>
            <div>
              <small className="text-muted">Assigned Gate</small>
              <p><strong style={{color: 'var(--warning)'}}>{ticket.gate}</strong></p>
            </div>
            <div>
              <small className="text-muted">Seat No.</small>
              <p><strong>{ticket.seatNumber}</strong></p>
            </div>
          </div>
          
          <button className="btn-secondary mt-4" onClick={() => setTicket(null)} style={{width: '100%'}}>
            Generate Another
          </button>
        </div>
      )}
    </div>
  );
}
