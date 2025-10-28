/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD COMPONENT - Complete with Charts and Correct Balance Calculation
 * Features: Summary Cards, Charts, Bank Details with Base Amounts
 * ═══════════════════════════════════════════════════════════════════════════
 */

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
        console.log('Dashboard loaded:', r.data);
        setDashboardData(r.data);
      } else {
        setError('Failed to load dashboard');
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
        setTransactions(Array.isArray(r.data) ? r.data : []);
      }
    } catch (e) {
      console.error('Transactions error:', e);
    }
  };
  
  // Error State
  if (error) {
    return (
      <div className="card" style={{ background: '#fee2e2', border: '2px solid #fca5a5' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Error</h2>
        <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>
        <button onClick={loadDashboard} className="btn btn-primary">🔄 Retry</button>
      </div>
    );
  }
  
  // Loading State
  if (!dashboardData) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  // Extract data
  const banks = Array.isArray(dashboardData.banks) ? dashboardData.banks : [];
  const totalBalance = parseFloat(dashboardData.totalBalance) || 0;
  const totalIncome = parseFloat(dashboardData.totalIncome) || 0;
  const totalExpense = Math.abs(parseFloat(dashboardData.totalExpense) || 0);
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0;
  const allTransactions = Array.isArray(transactions) ? transactions : [];
  
  // Get last 6 months
  const getLastMonths = (count) => {
    const months = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }
    return months;
  };
  
  const last6Months = getLastMonths(6);
  
  // Calculate monthly data
  const monthlyData = last6Months.map(month => {
    const monthTransactions = allTransactions.filter(t => t.date && t.date.startsWith(month.key));
    const income = monthTransactions.filter(t => parseFloat(t.amount) > 0).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = Math.abs(monthTransactions.filter(t => parseFloat(t.amount) < 0).reduce((sum, t) => sum + parseFloat(t.amount), 0));
    return { month: month.label, income, expense, net: income - expense };
  });
  
  // Bank-wise calculations
  const bankIncome = banks.map(bank => allTransactions.filter(t => t.bank === bank.code && parseFloat(t.amount) > 0).reduce((sum, t) => sum + parseFloat(t.amount), 0));
  const bankExpense = banks.map(bank => Math.abs(allTransactions.filter(t => t.bank === bank.code && parseFloat(t.amount) < 0).reduce((sum, t) => sum + parseFloat(t.amount), 0)));
  
  // Chart Data
  const monthlyIncomeExpenseData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      { label: 'Income (₹)', data: monthlyData.map(d => d.income), borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.4 },
      { label: 'Expense (₹)', data: monthlyData.map(d => d.expense), borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.4 }
    ]
  };
  
  const monthlySavingsData = {
    labels: monthlyData.map(d => d.month),
    datasets: [{ label: 'Net Savings (₹)', data: monthlyData.map(d => d.net), backgroundColor: monthlyData.map(d => d.net >= 0 ? '#16a34a' : '#dc2626'), borderRadius: 6 }]
  };
  
  const creditDebitData = {
    labels: ['Credit (Income)', 'Debit (Expense)'],
    datasets: [{ data: [totalIncome, totalExpense], backgroundColor: ['#16a34a', '#dc2626'], borderColor: '#ffffff', borderWidth: 3 }]
  };
  
  const bankDistributionData = {
    labels: banks.map(b => b.name),
    datasets: [{ data: banks.map(b => Math.abs(parseFloat(b.balance) || 0)), backgroundColor: banks.map(b => b.color || '#2563eb'), borderColor: '#ffffff', borderWidth: 2 }]
  };
  
  const bankIncomeExpenseData = {
    labels: banks.map(b => b.name),
    datasets: [
      { label: 'Income (₹)', data: bankIncome, backgroundColor: '#16a34a', borderRadius: 6 },
      { label: 'Expense (₹)', data: bankExpense, backgroundColor: '#dc2626', borderRadius: 6 }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ₹${(ctx.parsed.y || ctx.parsed || 0).toFixed(2)}` } }
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (value) => '₹' + value } } }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed || 0;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ₹${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  return (
    <div>
      {/* Page Header */}
      <h1 style={{ 
        marginBottom: '2rem', 
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: '800',
        color: 'var(--color-text-primary)'
      }}>
        📊 Financial Dashboard
      </h1>
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          { 
            label: '💰 Total Balance', 
            value: '₹' + totalBalance.toFixed(2), 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            info: `Across ${banks.length} account${banks.length !== 1 ? 's' : ''}`,
            shadow: 'rgba(102, 126, 234, 0.3)'
          },
          { 
            label: '📈 Total Credit', 
            value: '₹' + totalIncome.toFixed(2), 
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', 
            info: `${allTransactions.filter(t => parseFloat(t.amount) > 0).length} transactions`,
            shadow: 'rgba(56, 239, 125, 0.3)'
          },
          { 
            label: '📉 Total Debit', 
            value: '₹' + totalExpense.toFixed(2), 
            gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', 
            info: `${allTransactions.filter(t => parseFloat(t.amount) < 0).length} transactions`,
            shadow: 'rgba(238, 9, 121, 0.3)'
          },
          { 
            label: '💎 Savings Rate', 
            value: savingsRate + '%', 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            info: totalBalance >= 0 ? 'Good progress!' : 'Keep saving',
            shadow: 'rgba(79, 172, 254, 0.3)'
          }
        ].map((card, i) => (
          <div key={i} className="card" style={{ 
            background: card.gradient, 
            color: 'white', 
            boxShadow: '0 8px 16px ' + card.shadow,
            border: 'none'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
              {card.info}
            </div>
          </div>
        ))}
      </div>
      
      {allTransactions.length > 0 ? (
        <>
          {/* Chart 1: Monthly Trend - Full Width */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 className="card-title">📈 Monthly Income vs Expense (Last 6 Months)</h3>
            <div style={{ height: '350px' }}>
              <Line data={monthlyIncomeExpenseData} options={chartOptions} />
            </div>
          </div>
          
          {/* Charts Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div className="card">
              <h3 className="card-title">💰 Monthly Net Savings</h3>
              <div style={{ height: '320px' }}>
                <Bar data={monthlySavingsData} options={chartOptions} />
              </div>
            </div>
            
            <div className="card">
              <h3 className="card-title">⚖️ Credit vs Debit</h3>
              <div style={{ height: '320px' }}>
                <Doughnut data={creditDebitData} options={pieOptions} />
              </div>
            </div>
            
            <div className="card">
              <h3 className="card-title">🏦 Bank Distribution</h3>
              <div style={{ height: '320px' }}>
                <Doughnut data={bankDistributionData} options={pieOptions} />
              </div>
            </div>
          </div>
          
          {/* Chart 5: Bank Comparison */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 className="card-title">🏦 Bank-wise Income vs Expense</h3>
            <div style={{ height: '350px' }}>
              <Bar data={bankIncomeExpenseData} options={chartOptions} />
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No transaction data yet
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Add transactions to see charts and analytics
          </p>
        </div>
      )}
      
      {/* Bank Account Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏦 Bank Account Details</h2>
          <p className="card-subtitle">
            Complete breakdown of all your bank accounts with base amounts and transactions
          </p>
        </div>
        
        {banks.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              No bank accounts
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
              Add banks in Settings to get started
            </p>
          </div>
        ) : (
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {banks.map((bank, index) => {
                const income = bankIncome[index] || 0;
                const expense = bankExpense[index] || 0;
                const prevBalance = parseFloat(bank.previous_balance) || 0;
                const monthlyInput = parseFloat(bank.monthly_input) || 0;
                const baseAmount = prevBalance + monthlyInput;
                const currentBalance = parseFloat(bank.balance) || 0;
                
                return (
                  <div
                    key={bank.code}
                    style={{
                      padding: '2rem',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-lg)',
                      borderLeft: '6px solid ' + (bank.color || '#2563eb'),
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'var(--transition)'
                    }}
                  >
                    {/* Bank Name & Balance */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '2rem',
                      alignItems: 'start',
                      marginBottom: '1.5rem'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: '700', 
                          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          color: 'var(--color-text-primary)'
                        }}>
                          <span style={{ fontSize: '1.75rem' }}>
                            {bank.code === 'cash' ? '💰' : '🏦'}
                          </span>
                          {bank.name}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--color-text-light)',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {bank.code}
                        </div>
                      </div>
                      
                      {/* Current Balance */}
                      <div style={{ 
                        textAlign: 'right',
                        padding: '1rem 1.5rem',
                        background: 'var(--color-card)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-sm)',
                        border: '2px solid ' + (currentBalance >= 0 ? '#dcfce7' : '#fee2e2'),
                        minWidth: '180px'
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: 'var(--color-text-light)',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem'
                        }}>
                          Current Balance
                        </div>
                        <div style={{ 
                          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', 
                          fontWeight: 'bold',
                          color: currentBalance >= 0 ? '#16a34a' : '#dc2626'
                        }}>
                          {currentBalance >= 0 ? '' : '−'}₹{Math.abs(currentBalance).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Opening Balance Section */}
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                      borderRadius: 'var(--radius)',
                      marginBottom: '1rem',
                      border: '1px solid #c7d2fe'
                    }}>
                      <div style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        💼 Opening Balance (From Settings)
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Previous: </span>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            ₹{prevBalance.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Monthly: </span>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            ₹{monthlyInput.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Base: </span>
                          <span style={{ fontWeight: '700', color: '#2563eb' }}>
                            ₹{baseAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transaction Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '1rem',
                      padding: '1.25rem',
                      background: 'var(--color-card)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xs)'
                    }}>
                      {[
                        { icon: '📈', label: 'Credit', value: income, color: '#16a34a' },
                        { icon: '📉', label: 'Debit', value: expense, color: '#dc2626' },
                        { icon: '💰', label: 'Transaction Net', value: income - expense, color: (income - expense) >= 0 ? '#16a34a' : '#dc2626' }
                      ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '0.75rem',
                            color: 'var(--color-text-light)',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem'
                          }}>
                            {stat.icon} {stat.label}
                          </div>
                          <div style={{ 
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                            fontWeight: 'bold',
                            color: stat.color
                          }}>
                            ₹{stat.value.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Balance Formula */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                      textAlign: 'center',
                      border: '1px solid var(--color-border)'
                    }}>
                      <strong>Formula:</strong> Base (₹{baseAmount.toFixed(2)}) + Credit (₹{income.toFixed(2)}) − Debit (₹{expense.toFixed(2)}) = <strong style={{ color: currentBalance >= 0 ? '#16a34a' : '#dc2626' }}>₹{currentBalance.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
