import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="nav">
      <div className="container nav-container">
        <button 
          className={`nav-btn ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          📊 Dashboard
        </button>
        
        <button 
          className={`nav-btn ${isActive('/transactions') ? 'active' : ''}`}
          onClick={() => navigate('/transactions')}
        >
          💳 Transactions
        </button>
        
        <button 
          className={`nav-btn ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          ⚙️ Settings
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
