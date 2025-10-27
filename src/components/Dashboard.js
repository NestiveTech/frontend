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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

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
    loadAllTransactions();
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
  
  const loadAllTransactions = async () => {
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        setTransactions(r.data);
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
  
  // Prepare data for charts
  const bankLabels = userBanks.map(b => b.name);
  const bankBalances = userBanks.map(b => {
    const balance = dashboardData.banks?.find(bank => bank.code === b.code);
    return balance ? parseFloat(balance.balance) : 0;
  });
  const bankColors = userBanks.map(b => b.color || '#2563eb');
  
  // Calculate income vs expense per bank
  const bankIncome = userBanks.map(b => {
    return transactions
      .filter(t => t.bank === b.code && parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });
  
  const bankExpense = userBanks.map(b => {
    return Math.abs(transactions
      .filter(t => t.bank === b.code && parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0));
  });
  
  // Last 30 days balance trend
  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }
  
  const balanceTrend = last30Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date <= date);
    return dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });
  
  // Income vs Expense over time (last 7 days)
  const last7Days = last30Days.slice(-7);
  const dailyIncome = last7Days.map(date => {
    return transactions
      .filter(t => t.date === date && parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });
  
  const dailyExpense = last7Days.map(date => {
    return Math.abs(transactions
      .filter(t => t.date === date && parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0));
  });
  
  // Chart 1: Bank Balance Distribution (Doughnut)
  const doughnutData = {
    labels: bankLabels,
    datasets: [{
      label: 'Current Balance',
      data: bankBalances,
      backgroundColor: bankColors,
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10
    }]
  };
  
  // Chart 2: Bank Balance Comparison (Bar)
  const barData = {
    labels: bankLabels,
    datasets: [{
      label: 'Current Balance (₹)',
      data: bankBalances,
      backgroundColor: bankColors,
      borderRadius: 8,
      borderWidth: 0
    }]
  };
  
  // Chart 3: 30-Day Balance Trend (Line)
  const balanceTrendData = {
    labels: last30Days.map(d => {
      const date = new Date(d);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [{
      label: 'Total Balance (₹)',
      data: balanceTrend,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    }]
  };
  
  // Chart 4: Income vs Expense (Bar - Grouped)
  const incomeExpenseData = {
    labels: last7Days.map(d => {
      const date = new Date(d);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Income (₹)',
        data: dailyIncome,
        backgroundColor: '#16a34a',
        borderRadius: 6
      },
      {
        label: 'Expense (₹)',
        data: dailyExpense,
        backgroundColor: '#dc2626',
        borderRadius: 6
      }
    ]
  };
  
  // Chart 5: Income vs Expense Per Bank (Grouped Bar)
  const bankIncomeExpenseData = {
    labels: bankLabels,
    datasets: [
      {
        label: 'Total Income (₹)',
        data: bankIncome,
        backgroundColor: '#16a34a',
        borderRadius: 6
      },
      {
        label: 'Total Expense (₹)',
        data: bankExpense,
        backgroundColor: '#dc2626',
        borderRadius: 6
      }
    ]
  };
  
  // Chart 6: Expense Distribution by Bank (Pie)
  const expensePieData = {
    labels: bankLabels,
    datasets: [{
      label: 'Expenses by Bank',
      data: bankExpense,
      backgroundColor: [
        '#ef4444',
        '#f97316',
        '#f59e0b',
        '#eab308',
        '#84cc16',
        '#22c55e'
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += '₹' + context.parsed.y.toFixed(2);
            } else if (context.parsed !== null) {
              label += '₹' + context.parsed.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  const totalBalance = dashboardData.totalBalance || 0;
  const totalIncome = dashboardData.totalIncome || 0;
  const totalExpense = Math.abs(dashboardData.totalExpense || 0);
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0;
  
  return (
    <div>
      <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Financial Dashboard
      </h1>
      
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
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>💰 Total Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            ₹{totalBalance.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            Across {userBanks.length} {userBanks.length === 1 ? 'account' : 'accounts'}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(56, 239, 125, 0.3)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>📈 Total Income</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            ₹{totalIncome.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {transactions.filter(t => parseFloat(t.amount) > 0).length} transactions
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(238, 9, 121, 0.3)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>📉 Total Expenses</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            ₹{totalExpense.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {transactions.filter(t => parseFloat(t.amount) < 0).length} transactions
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(79, 172, 254, 0.3)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>💎 Savings Rate</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {savingsRate}%
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {totalBalance >= 0 ? 'Keep it up!' : 'Work on saving'}
          </div>
        </div>
      </div>
      
      {/* Charts Grid - Row 1 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Chart 1: Bank Balance Distribution */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🍩 Balance Distribution
          </h3>
          <div style={{ height: '320px' }}>
            <Doughnut data={doughnutData} options={pieOptions} />
          </div>
        </div>
        
        {/* Chart 2: Bank Balance Comparison */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Balance Comparison
          </h3>
          <div style={{ height: '320px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        {/* Chart 6: Expense Distribution by Bank */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🥧 Expense Distribution
          </h3>
          <div style={{ height: '320px' }}>
            <Pie data={expensePieData} options={pieOptions} />
          </div>
        </div>
      </div>
      
      {/* Chart 3: 30-Day Balance Trend - Full Width */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📈 30-Day Balance Trend
        </h3>
        <div style={{ height: '350px' }}>
          <Line data={balanceTrendData} options={chartOptions} />
        </div>
      </div>
      
      {/* Charts Grid - Row 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Chart 4: Income vs Expense (Daily) */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💸 Daily Income vs Expense
          </h3>
          <div style={{ height: '320px' }}>
            <Bar data={incomeExpenseData} options={chartOptions} />
          </div>
        </div>
        
        {/* Chart 5: Income vs Expense Per Bank */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏦 Bank-wise Income vs Expense
          </h3>
          <div style={{ height: '320px' }}>
            <Bar data={bankIncomeExpenseData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Bank Balances Table */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏦 Bank Account Details
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {dashboardData.banks?.map(bank => {
            const bankInfo = userBanks.find(b => b.code === bank.code);
            const balance = parseFloat(bank.balance);
            const income = bankIncome[userBanks.findIndex(b => b.code === bank.code)] || 0;
            const expense = bankExpense[userBanks.findIndex(b => b.code === bank.code)] || 0;
            
            return (
              <div
                key={bank.code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${bankInfo?.color || '#2563eb'}`
                }}
              >
                <div>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '1.2rem', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {bank.code === 'cash' ? '💰' : '🏦'} {bank.name}
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.9rem',
                    color: '#64748b',
                    marginTop: '0.75rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600' }}>Income:</span> ₹{income.toFixed(2)}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600' }}>Expense:</span> ₹{expense.toFixed(2)}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600' }}>Net:</span> ₹{(income - expense).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Current Balance
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: balance >= 0 ? '#16a34a' : '#dc2626'
                  }}>
                    ₹{balance.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Recent Transactions */}
      {transactions.slice(-5).reverse().length > 0 && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔄 Recent Transactions
          </h2>
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
                    {txn.date} • {txn.bank === 'cash' ? '💰' : '🏦'} {txn.bank}
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
