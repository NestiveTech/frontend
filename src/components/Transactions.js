import React, { useState, useEffect } from 'react';

const Transactions = ({ currentUser, apiCall, userBanks, loadBanks, setLoading }) => {
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    bank: 'cash' // DEFAULT TO CASH
  });
  
  useEffect(() => {
    loadTransactions();
    if (userBanks.length > 0 && !formData.bank) {
      // Ensure Cash is default
      const cashBank = userBanks.find(b => b.code === 'cash');
      if (cashBank) {
        setFormData(prev => ({ ...prev, bank: 'cash' }));
      }
    }
  }, [userBanks]);
  
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        setTransactions(r.data.reverse());
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.bank) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      if (editingId) {
        const r = await apiCall('updateTransaction', {
          id: editingId,
          ...formData
        });
        if (r.success) {
          alert('✅ Transaction updated!');
          setEditingId(null);
        } else {
          alert('❌ ' + r.error);
        }
      } else {
        const r = await apiCall('addTransaction', formData);
        if (r.success) {
          alert('✅ Transaction added!');
        } else {
          alert('❌ ' + r.error);
        }
      }
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        bank: 'cash' // RESET TO CASH
      });
      setShowAddForm(false);
      await loadTransactions();
      await loadBanks();
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (txn) => {
    setFormData({
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      bank: txn.bank
    });
    setEditingId(txn.id);
    setShowAddForm(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('deleteTransaction', { id });
      if (r.success) {
        alert('✅ Transaction deleted!');
        await loadTransactions();
        await loadBanks();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      bank: 'cash' // RESET TO CASH
    });
  };
  
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
        <h1>💳 Transactions</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? '✖ Cancel' : '➕ Add Transaction'}
        </button>
      </div>
      
      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g., Groceries, Salary"
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Amount * (Negative for expense, Positive for income)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="e.g., -500 or +5000"
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Bank * (💰 Cash is default)
                </label>
                <select
                  value={formData.bank}
                  onChange={e => setFormData({...formData, bank: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select Bank</option>
                  {/* CASH ALWAYS FIRST */}
                  {userBanks
                    .sort((a, b) => a.code === 'cash' ? -1 : b.code === 'cash' ? 1 : 0)
                    .map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.code === 'cash' ? '💰 ' : ''}{bank.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-success">
                {editingId ? '💾 Update' : '➕ Add'} Transaction
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Transactions List */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Transaction History</h2>
        
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p>No transactions yet</p>
            <p style={{ fontSize: '0.875rem' }}>Click "Add Transaction" to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {transactions.map(txn => (
              <div
                key={txn.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {txn.date} • {txn.bank === 'cash' ? '💰 ' : ''}{txn.bank}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: parseFloat(txn.amount) >= 0 ? '#16a34a' : '#dc2626',
                  marginRight: '1rem'
                }}>
                  {parseFloat(txn.amount) >= 0 ? '+' : ''}₹{parseFloat(txn.amount).toFixed(2)}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(txn)}
                    className="btn btn-sm"
                    style={{ background: '#2563eb', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(txn.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
