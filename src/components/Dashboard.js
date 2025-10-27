import React, { useState, useEffect } from 'react';

const Dashboard = ({ currentUser, apiCall, userBanks, setLoading }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const r = await apiCall('getDashboard');
      
      if (r.success && r.data) {
        setDashboardData(r.data);
      } else {
        setError(r.error || 'Failed to load dashboard');
      }
    } catch (e) {
      setError('Failed to load dashboard: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amt) => {
    return `₹${parseFloat(amt || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };
  
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2>Error Loading Dashboard</h2>
        <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={loadDashboard} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  const hasBanks = dashboardData.banks && Object.keys(dashboardData.banks).length > 0;
  
  if (!hasBanks) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏦</div>
        <h2>No Banks Configured</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Get started by adding your first bank account in Settings
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Go to Settings
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>📊 Dashboard</h1>
        <button onClick={loadDashboard} className="btn btn-secondary">
          🔄 Refresh
        </button>
      </div>
      
      {/* Salary Section */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>💰 Salary Information</h2>
        <div style={{ fontSize: '1.5rem', color: '#16a34a', fontWeight: 'bold' }}>
          {formatCurrency(dashboardData.salary)}
        </div>
      </div>
      
      {/* Banks */}
      {Object.keys(dashboardData.banks).map(bankCode => {
        const bank = dashboardData.banks[bankCode];
        return (
          <div key={bankCode} style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${bank.color}, ${bank.color}dd)`,
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <h2 style={{ margin: 0 }}>🏦 {bank.name}</h2>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Previous Balance
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {formatCurrency(bank.previous_balance)}
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Monthly Input
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {formatCurrency(bank.monthly_input)}
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Opening Balance
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {formatCurrency(bank.opening_balance)}
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Expenses
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {formatCurrency(bank.expenses)}
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
                borderRadius: '8px',
                border: '2px solid #2563eb'
              }}>
                <div style={{ color: '#1e40af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Net Balance
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  {formatCurrency(bank.net_balance)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Combined Totals */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2563eb, #1e40af)', 
        padding: '1.5rem', 
        borderRadius: '12px',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>📊 Combined Totals</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Combined Opening
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {formatCurrency(dashboardData.combined_opening)}
            </div>
          </div>
          
          <div>
            <div style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Combined Expenses
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {formatCurrency(dashboardData.combined_expenses)}
            </div>
          </div>
          
          <div>
            <div style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Combined Net
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
              {formatCurrency(dashboardData.combined_net)}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
        Last updated: {new Date(dashboardData.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default Dashboard;
