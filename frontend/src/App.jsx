import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TicketView from './pages/TicketView';
import ScannerInterface from './pages/ScannerInterface';
import Dashboard from './pages/Dashboard';
import LiveNavigation from './pages/LiveNavigation';

function Nav() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path ? 'active' : '';

  return (
    <nav>
      <div className="brand">EventPulse</div>
      <Link to="/" className={isActive('/')}>Ticket</Link>
      <Link to="/scan" className={isActive('/scan')}>Scanner</Link>
      <Link to="/nav" className={isActive('/nav')}>Map</Link>
      <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
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
