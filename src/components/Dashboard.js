import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ currentUser, apiCall, userBanks, setLoading }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    loadDashboard();
    loadRecentTransactions();
  }, []);
  
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getDashboard');
      if (r.success && r.data) {
        setDashboardData(r.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRecentTransactions = async () => {
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        // Get last 5 transactions
        setTransactions(r.data.slice(-5).reverse());
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    }
  };
  
  if (!dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  // Prepare chart data
  const bankLabels = userBanks.map(b => b.name);
  const bankBalances = userBanks.map(b => {
    const balance = dashboardData.banks?.find(bank => bank.code === b.code);
    return balance ? parseFloat(balance.balance) : 0;
  });
  
  const bankColors = userBanks.map(b => b.color || '#2563eb');
  
  // Doughnut Chart - Bank Distribution
  const doughnutData = {
    labels: bankLabels,
    datasets: [{
      label: 'Bank Balances',
      data: bankBalances,
      backgroundColor: bankColors,
      borderColor: '#ffffff',
      borderWidth: 2,
    }]
  };
  
  // Bar Chart - Bank Comparison
  const barData = {
    labels: bankLabels,
    datasets: [{
      label: 'Current Balance',
      data: bankBalances,
      backgroundColor: bankColors,
      borderRadius: 8,
    }]
  };
  
  // Line Chart - Transaction Trend (last 7 days)
  const last7Days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  const lineData = {
    labels: last7Days.map(d => {
      const date = new Date(d);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [{
      label: 'Daily Spending',
      data: last7Days.map(date => {
        const dayTotal = transactions
          .filter(t => t.date === date && parseFloat(t.amount) < 0)
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
        return dayTotal;
      }),
      borderColor: '#dc2626',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };
  
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
            ₹{dashboardData.totalBalance?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Income</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ₹{dashboardData.totalIncome?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Expenses</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ₹{Math.abs(dashboardData.totalExpense || 0).toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Doughnut Chart */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>💰 Bank Distribution</h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
        
        {/* Bar Chart */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 Bank Comparison</h3>
          <div style={{ height: '300px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Line Chart - Full Width */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>📈 Spending Trend (Last 7 Days)</h3>
        <div style={{ height: '300px' }}>
          <Line data={lineData} options={chartOptions} />
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
        <div style={{ display: 'grid', gap: '1rem' }}>
          {dashboardData.banks?.map(bank => (
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
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{bank.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {bank.code}
                </div>
              </div>
              <div style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold',
                color: parseFloat(bank.balance) >= 0 ? '#16a34a' : '#dc2626'
              }}>
                ₹{parseFloat(bank.balance).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
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
            {transactions.map((txn, index) => (
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
