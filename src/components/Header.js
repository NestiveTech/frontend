import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      authService.logout();
      navigate('/login');
    }
  };
  
  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-left">
          <span className="logo-icon">💰</span>
          <h1 className="header-title">Balance Sheet Manager</h1>
        </div>
        
        <div className="desktop-user-section">
          <div className="user-info">
            {user?.picture && (
              <img src={user.picture} alt={user?.email} className="user-avatar" />
            )}
            <div className="user-details">
              <div className="user-name">{user?.email}</div>
            </div>
          </div>
          
          <button onClick={handleSignOut} className="btn btn-danger btn-sm">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
