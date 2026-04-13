import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TicketView from './pages/TicketView';
import ScannerInterface from './pages/ScannerInterface';
import Dashboard from './pages/Dashboard';
import LiveNavigation from './pages/LiveNavigation';

function Nav() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path ? 'active' : '';

  return (
    <nav role="navigation" aria-label="Main navigation">
      <div className="brand" aria-label="EventPulse Home">EventPulse 🏟️</div>
      <Link to="/" className={isActive('/')} aria-label="Book Ticket" aria-current={loc.pathname === '/' ? 'page' : undefined}>🎫 Ticket</Link>
      <Link to="/scan" className={isActive('/scan')} aria-label="Entry Scanner" aria-current={loc.pathname === '/scan' ? 'page' : undefined}>📷 Scanner</Link>
      <Link to="/nav" className={isActive('/nav')} aria-label="Stadium Map" aria-current={loc.pathname === '/nav' ? 'page' : undefined}>🗺️ Map</Link>
      <Link to="/dashboard" className={isActive('/dashboard')} aria-label="Admin Dashboard" aria-current={loc.pathname === '/dashboard' ? 'page' : undefined}>📊 Dashboard</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<TicketView />} />
        <Route path="/scan" element={<ScannerInterface />} />
        <Route path="/nav" element={<LiveNavigation />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
