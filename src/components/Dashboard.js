import React, { useState, useEffect } from 'react';

const Dashboard = ({ currentUser, apiCall, userBanks, setLoading }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDashboard();
    loadAllTransactions();
  }, []);
  
  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiCall('getDashboard');
      if (r.success && r.data) {
        setDashboardData(r.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (e) {
      console.error('Dashboard error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAllTransactions = async () => {
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        setTransactions(r.data);
      }
    } catch (e) {
      console.error('Transactions error:', e);
    }
  };
  
  // Show error if exists
  if (error) {
    return (
      <div style={{
        background: '#fee',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #fcc'
      }}>
        <h2 style={{ color: '#c00' }}>⚠️ Error Loading Dashboard</h2>
        <p style={{ color: '#600' }}>{error}</p>
        <button onClick={loadDashboard} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }
  
  // Show loading spinner
  if (!dashboardData) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem',
        background: 'white',
        borderRadius: '12px'
      }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading dashboard...</p>
      </div>
    );
  }
  
  // Safety check for banks data
  const banks = dashboardData.banks || [];
  const totalBalance = dashboardData.totalBalance || 0;
  const totalIncome = dashboardData.totalIncome || 0;
  const totalExpense = Math.abs(dashboardData.totalExpense || 0);
  
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>📊 Dashboard</h1>
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ₹{totalBalance.toFixed(2)}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Income</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ₹{totalIncome.toFixed(2)}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Expenses</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ₹{totalExpense.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Bank Balances */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>🏦 Bank Balances</h2>
        
        {banks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p>No bank data available</p>
            <p style={{ fontSize: '0.875rem' }}>Go to Settings to add banks</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {banks.map(bank => (
              <div
                key={bank.code}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${bank.color || '#2563eb'}`
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                    {bank.code === 'cash' ? '💰 ' : ''}{bank.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {bank.code}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 'bold',
                  color: parseFloat(bank.balance) >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  ₹{parseFloat(bank.balance || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🔄 Recent Transactions</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {transactions.slice(-5).reverse().map((txn, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{txn.description}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {txn.date} • {txn.bank}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: parseFloat(txn.amount) >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  {parseFloat(txn.amount) >= 0 ? '+' : ''}₹{parseFloat(txn.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
