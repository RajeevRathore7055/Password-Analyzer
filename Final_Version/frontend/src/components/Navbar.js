import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const active = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = () => { logout(); navigate('/login'); };
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">🛡️ SECUREPASS</Link>
      <div className="nav-links">
        <Link to="/analyzer"      className={active('/analyzer')}>ANALYZER</Link>
        <Link to="/security-tips" className={active('/security-tips')}>💡 TIPS</Link>
        <Link to="/passphrase"    className={active('/passphrase')}>🔑 PASSPHRASE</Link>
        {user && <Link to="/history" className={active('/history')}>HISTORY</Link>}
        {isAdmin && (
          <Link to="/admin" className={active('/admin')}>
            {user?.role === 'superadmin' ? '👑 SUPER ADMIN' : 'ADMIN'}
          </Link>
        )}
        {!user ? (
          <>
            <Link to="/login"    className={active('/login')}>LOGIN</Link>
            <Link to="/register" className={active('/register')}>REGISTER</Link>
          </>
        ) : (
          <button onClick={handleLogout} className="nav-link danger">LOGOUT</button>
        )}
      </div>
    </nav>
  );
}
