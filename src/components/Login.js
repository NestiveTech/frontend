import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleSuccess = async (credentialResponse) => {
    try {
      console.log('Login success');
      await authService.loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };
  
  const handleError = () => {
    console.error('Google Login Failed');
    alert('Google login failed. Please try again.');
  };
  
  return (
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
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="filled_blue"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="280"
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
        
        <div className="auth-footer">
          <p>© 2025 Balance Sheet Manager</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
