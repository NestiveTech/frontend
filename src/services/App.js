import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import './styles/App.css';

const API_BASE_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasSpreadsheet, setHasSpreadsheet] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [userBanks, setUserBanks] = useState([]);
  
  // API Call Function - FIXED
  const apiCall = async (action, params = {}, emailOverride = null) => {
    const url = new URL(API_BASE_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('_t', Date.now());
    
    // Use emailOverride if provided, otherwise use currentUser
    const email = emailOverride || (currentUser ? currentUser.email : null);
    if (email) {
      url.searchParams.set('userEmail', email);
    }
    
    Object.keys(params).forEach(k => {
      if (params[k] !== null && params[k] !== undefined) {
        url.searchParams.set(k, params[k]);
      }
    });
    
    console.log(`📡 API: ${action}`, { email, params });
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Response: ${action}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${action}):`, error);
      throw new Error(`Network error: ${error.message}`);
    }
  };
  
  // Parse JWT
  const parseJwt = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  };
  
  // Handle Google Sign In
  const handleCredentialResponse = async (response) => {
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    const user = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
    
    console.log('%c✅ User authenticated', 'color: #16a34a; font-weight: bold;', user.email);
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Check user setup
    setLoading(true);
    try {
      // Pass email as third parameter since currentUser isn't set yet
      const r = await apiCall('checkUser', {}, user.email);
      
      if (r.success) {
        if (r.hasSpreadsheet) {
          setHasSpreadsheet(true);
          if (r.sheetUrl) {
            setSpreadsheetUrl(r.sheetUrl);
          }
          // Load initial data
          await loadBanks(user.email);
        } else {
          setHasSpreadsheet(false);
        }
      }
    } catch (e) {
      console.error('Check error:', e);
      alert('Failed to check user setup: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Create Spreadsheet
  const handleCreateSpreadsheet = async () => {
    setLoading(true);
    try {
      const r = await apiCall('createSpreadsheet');
      
      if (r.success) {
        alert('✅ ' + (r.message || 'Spreadsheet created successfully!'));
        setHasSpreadsheet(true);
        if (r.sheetUrl) {
          setSpreadsheetUrl(r.sheetUrl);
        }
        await loadBanks();
      } else {
        alert('❌ ' + (r.error || 'Failed to create spreadsheet'));
      }
    } catch (e) {
      console.error('Create error:', e);
      alert('❌ Failed to create spreadsheet: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Load Banks
  const loadBanks = async (emailOverride = null) => {
    try {
      const r = await apiCall('getBanks', {}, emailOverride);
      
      if (r.success && r.data) {
        setUserBanks(r.data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to load banks:', e);
      return false;
    }
  };
  
  // Sign Out
  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setHasSpreadsheet(false);
      setSpreadsheetUrl('');
      setUserBanks([]);
      setCurrentPage('dashboard');
    }
  };
  
  // Login Screen
  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="auth-screen">
          <div className="auth-container">
            <div className="auth-header">
              <div className="auth-icon">💰</div>
              <h1>Balance Sheet Manager</h1>
              <p className="auth-subtitle">Multi-User Finance Tracker</p>
            </div>
            
            <div className="auth-card">
              <h2>Sign in to Continue</h2>
              <p className="auth-description">
                Use your Google account to access your personalized balance sheet.
              </p>
              
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleCredentialResponse}
                  onError={() => alert('❌ Google login failed')}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                />
              </div>
              
              <div className="auth-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Secure Google Authentication</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Personal Google Sheets Database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }
  
  // Setup Screen (No Spreadsheet)
  if (!hasSpreadsheet) {
    return (
      <div className="app-screen">
        <div className="setup-screen">
          <div className="setup-container">
            <div className="setup-icon">📊</div>
            <h1>Welcome to Balance Sheet Manager!</h1>
            <p className="setup-description">
              We need to create your personal Google Sheet to store your financial data.
              This sheet will be created in your Google Drive and only you will have access to it.
            </p>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Creating your spreadsheet...</p>
              </div>
            ) : (
              <button onClick={handleCreateSpreadsheet} className="btn btn-primary btn-lg">
                📊 Create My Spreadsheet
              </button>
            )}
            
            <div className="setup-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure & Private</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">☁️</span>
                <span>Cloud Storage</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main App
  return (
    <div className="app-screen">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="header-left">
            <span className="logo-icon">💰</span>
            <h1 className="header-title">Balance Sheet</h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <img src={currentUser.picture} alt={currentUser.name} className="user-avatar" />
              <div className="user-details">
                <div className="user-name">{currentUser.name}</div>
                <div className="user-email">{currentUser.email}</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="btn btn-danger btn-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="nav">
        <div className="container nav-container">
          <button 
            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${currentPage === 'transactions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('transactions')}
          >
            💳 Transactions
          </button>
          <button 
            className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            ⚙️ Settings
          </button>
          
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-btn sheet-link"
            >
              📄 Open Sheet
            </a>
          )}
        </div>
      </nav>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      
      {/* Pages */}
      <div className="container">
        {currentPage === 'dashboard' && (
          <Dashboard 
            currentUser={currentUser} 
            apiCall={apiCall} 
            userBanks={userBanks}
            setLoading={setLoading}
          />
        )}
        
        {currentPage === 'transactions' && (
          <Transactions 
            currentUser={currentUser} 
            apiCall={apiCall} 
            userBanks={userBanks}
            loadBanks={loadBanks}
            setLoading={setLoading}
          />
        )}
        
        {currentPage === 'settings' && (
          <Settings 
            currentUser={currentUser} 
            apiCall={apiCall} 
            userBanks={userBanks}
            loadBanks={loadBanks}
            spreadsheetUrl={spreadsheetUrl}
            setLoading={setLoading}
          />
        )}
      </div>
    </div>
  );
}

export default App;
