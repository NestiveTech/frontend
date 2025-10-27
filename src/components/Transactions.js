import React, { useState, useEffect } from 'react';

const Transactions = ({ currentUser, apiCall, userBanks, loadBanks, setLoading }) => {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    bank: userBanks[0]?.code || ''
  });
  
  useEffect(() => {
    loadTransactions();
  }, []);
  
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        setTransactions(r.data);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.bank) {
      alert('Please fill required fields');
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('addTransaction', {
        date: formData.date,
        description: encodeURIComponent(formData.description),
        amount: formData.amount,
        bank: formData.bank
      });
      
      if (r.success) {
        alert('✅ Transaction added!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          bank: userBanks[0]?.code || ''
        });
        setShowForm(false);
        await loadTransactions();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    
    setLoading(true);
    try {
      const r = await apiCall('deleteTransaction', { id });
      if (r.success) {
        alert('✅ Deleted!');
        await loadTransactions();
      }
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amt) => {
    return `₹${parseFloat(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>💳 Transactions</h1>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
        >
          {showForm ? '✖ Cancel' : '➕ Add Transaction'}
        </button>
      </div>
      
      {showForm && (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2>Add New Transaction</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Bank *
                </label>
                <select
                  value={formData.bank}
                  onChange={e => setFormData({...formData, bank: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {userBanks.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-success">
              ➕ Add Transaction
            </button>
          </form>
        </div>
      )}
      
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>All Transactions</h2>
        
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Description</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Bank</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>{t.description || '-'}</td>
                    <td style={{ padding: '1rem', color: '#dc2626', fontWeight: 'bold' }}>
                      {formatCurrency(t.amount)}
                    </td>
                    <td style={{ padding: '1rem' }}>{t.bank}</td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: '1.25rem'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
