import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import './styles/App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [userBanks, setUserBanks] = useState([]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  const API_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;

  // Initialize on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('balanceSheetUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        checkUserSetup(user.email);
      } catch (e) {
        console.error('Failed to load saved user:', e);
        localStorage.removeItem('balanceSheetUser');
      }
    }
  }, []);

  // Parse JWT token (same as original)
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('JWT parse error:', e);
      return null;
    }
  };

  // API Call function (matches original logic)
  const apiCall = async (action, params = {}) => {
    if (!currentUser && action !== 'ping') {
      throw new Error('Not authenticated');
    }

    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('_t', Date.now()); // Cache buster

    if (currentUser) {
      url.searchParams.set('userEmail', currentUser.email);
    }

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key]);
      }
    });

    console.log(`📡 API: ${action}`);

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

  // Check user setup (original logic)
  const checkUserSetup = async (email) => {
    setLoading(true);
    try {
      const checkResult = await fetch(
        `${API_URL}?action=checkUser&userEmail=${email}&_t=${Date.now()}`
      );
      const checkData = await checkResult.json();

      console.log('✅ Check result:', checkData);

      if (!checkData.success) {
        alert('Failed to check user setup');
        setLoading(false);
        return;
      }

      if (!checkData.hasSpreadsheet) {
        // Show setup screen
        setSetupMode(true);
        setLoading(false);
      } else {
        // User has spreadsheet - proceed
        setSetupMode(false);
        setSpreadsheetUrl(checkData.sheetUrl);
        await initializeApp(email);
        setLoading(false);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      alert('❌ Setup failed: ' + error.message);
      setLoading(false);
    }
  };

  // Initialize app (original logic)
  const initializeApp = async (email) => {
    try {
      await loadBanks(email);
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  // Create spreadsheet (original logic)
  const handleCreateSpreadsheet = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const createResult = await fetch(
        `${API_URL}?action=createSpreadsheet&userEmail=${currentUser.email}&_t=${Date.now()}`
      );
      const createData = await createResult.json();

      if (createData.success) {
        setSpreadsheetUrl(createData.sheetUrl);
        setSetupMode(false);
        alert('✅ ' + createData.message);
        await initializeApp(currentUser.email);
      } else {
        alert('❌ Failed to create spreadsheet: ' + createData.error);
      }
    } catch (error) {
      alert('❌ Failed to create spreadsheet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load banks
  const loadBanks = async (email) => {
    if (!email && !currentUser) return;
    
    try {
      const userEmail = email || currentUser.email;
      const response = await fetch(
        `${API_URL}?action=getBanks&userEmail=${userEmail}&_t=${Date.now()}`
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserBanks(data.data);
        console.log('✅ Banks loaded:', data.data.length);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  };

  // Handle login success (original logic)
  const handleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const payload = parseJwt(credentialResponse.credential);
      
      if (!payload) {
        throw new Error('Failed to parse credential');
      }

      const user = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };

      console.log('%c✅ User authenticated', 'color: #16a34a; font-weight: bold;', user.email);

      setCurrentUser(user);
      localStorage.setItem('balanceSheetUser', JSON.stringify(user));

      // Check if user has spreadsheet
      await checkUserSetup(user.email);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setCurrentUser(null);
      setUserBanks([]);
      setSpreadsheetUrl('');
      setCurrentPage('dashboard');
      setSetupMode(false);
      localStorage.removeItem('balanceSheetUser');
    }
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Close menu when navigating
  const handleNavigation = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
    document.body.style.overflow = '';
  };

  // Render page content
  const renderPage = () => {
    const props = {
      currentUser,
      apiCall,
      userBanks,
      loadBanks: () => loadBanks(),
      spreadsheetUrl,
      setLoading
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...props} />;
      case 'transactions':
        return <Transactions {...props} />;
      case 'settings':
        return <Settings {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  // Login Screen
  if (!currentUser) {
    return (
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <div className="auth-screen">
          <div className="auth-container">
            <div className="auth-header">
              <div className="auth-icon">💰</div>
              <h1>Balance Sheet Manager</h1>
              <p className="auth-subtitle">Track your finances with Google Sheets</p>
            </div>
            
            <div className="auth-card">
              <h2>Welcome!</h2>
              <p className="auth-description">
                Sign in with Google to access your personal balance sheet manager
              </p>
              
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => alert('❌ Login failed')}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>

              <div className="auth-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Secure Google Authentication</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Powered by Google Sheets</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">☁️</span>
                  <span>Cloud-based & Always Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // Setup Screen (if no spreadsheet)
  if (setupMode) {
    return (
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <div className="setup-screen">
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Setting up your spreadsheet...</p>
            </div>
          )}
          
          <div className="setup-container">
            <div className="setup-icon">📊</div>
            <h1>Setup Your Balance Sheet</h1>
            <p className="setup-description">
              We'll create a personal Google Sheet for you to track your finances.
              This sheet will be linked to your account: <strong>{currentUser.email}</strong>
            </p>
            
            <button 
              onClick={handleCreateSpreadsheet}
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '✨ Create My Spreadsheet'}
            </button>

            <div className="setup-features">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Automatic sheet creation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔐</span>
                <span>Private & secure</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Cash account included</span>
              </div>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // Main App Screen
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="app-screen">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo-icon">💰</div>
              <h1 className="header-title">Balance Sheet</h1>
            </div>

            {/* Hamburger Button */}
            <button 
              className="hamburger-btn"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <div className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            <div className="header-right desktop-only">
              <div className="user-info">
                <img src={currentUser.picture} alt="User" className="user-avatar" />
                <div className="user-details">
                  <div className="user-name">{currentUser.name}</div>
                  <div className="user-email">{currentUser.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-danger btn-sm">
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Navigation */}
        <nav className="nav desktop-nav">
          <div className="nav-container">
            <button
              className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-btn ${currentPage === 'transactions' ? 'active' : ''}`}
              onClick={() => handleNavigation('transactions')}
            >
              💳 Transactions
            </button>
            <button
              className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavigation('settings')}
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

        {/* Mobile Menu Overlay */}
        {menuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            <h3>Menu</h3>
            <button className="close-btn" onClick={toggleMenu}>×</button>
          </div>

          <div className="mobile-nav-items">
            <div className="user-info" style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
              <img src={currentUser.picture} alt="User" className="user-avatar" />
              <div className="user-details">
                <div className="user-name">{currentUser.name}</div>
                <div className="user-email">{currentUser.email}</div>
              </div>
            </div>

            <button
              className={`mobile-nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <span className="nav-icon">📊</span>
              Dashboard
            </button>
            <button
              className={`mobile-nav-btn ${currentPage === 'transactions' ? 'active' : ''}`}
              onClick={() => handleNavigation('transactions')}
            >
              <span className="nav-icon">💳</span>
              Transactions
            </button>
            <button
              className={`mobile-nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavigation('settings')}
            >
              <span className="nav-icon">⚙️</span>
              Settings
            </button>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-btn"
              >
                <span className="nav-icon">📄</span>
                Open Sheet
              </a>
            )}

            <button
              className="mobile-nav-btn danger"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              Logout
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: 'var(--color-text-light)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <p>© {new Date().getFullYear()} Balance Sheet Manager • Made with ❤️</p>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
