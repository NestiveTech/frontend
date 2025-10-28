/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRANSACTIONS COMPONENT - Complete with Credit/Debit Management
 * Features: Add, Edit, Delete, Separate Credit/Debit, Transaction History
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';

const Transactions = ({ currentUser, apiCall, userBanks, loadBanks, setLoading }) => {
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactionType, setTransactionType] = useState('debit');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    bank: 'cash'
  });
  
  useEffect(() => {
    loadTransactions();
  }, []);
  
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getTransactions');
      if (r.success && r.data) {
        console.log('Transactions loaded:', r.data.length);
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
      alert('⚠️ Please fill all fields');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('⚠️ Please enter valid amount > 0');
      return;
    }
    
    const finalAmount = transactionType === 'debit' ? -Math.abs(amount) : Math.abs(amount);
    
    setLoading(true);
    try {
      if (editingId) {
        const r = await apiCall('updateTransaction', {
          id: editingId,
          ...formData,
          amount: finalAmount
        });
        if (r.success) {
          alert('✅ Transaction updated!');
          setEditingId(null);
        } else {
          alert('❌ ' + r.error);
        }
      } else {
        const r = await apiCall('addTransaction', {
          ...formData,
          amount: finalAmount
        });
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
        bank: 'cash'
      });
      setShowAddForm(false);
      setTransactionType('debit');
      await loadTransactions();
      await loadBanks();
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (txn) => {
    const amount = parseFloat(txn.amount);
    setFormData({
      date: txn.date,
      description: txn.description,
      amount: Math.abs(amount).toString(),
      bank: txn.bank
    });
    setTransactionType(amount < 0 ? 'debit' : 'credit');
    setEditingId(txn.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Delete this transaction?')) return;
    
    setLoading(true);
    try {
      const r = await apiCall('deleteTransaction', { id });
      if (r.success) {
        alert('✅ Deleted!');
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
    setTransactionType('debit');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      bank: 'cash'
    });
  };
  
  const openAddForm = (type) => {
    setTransactionType(type);
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      bank: 'cash'
    });
  };
  
  const creditTransactions = transactions.filter(t => parseFloat(t.amount) > 0);
  const debitTransactions = transactions.filter(t => parseFloat(t.amount) < 0);
  
  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: '800',
          color: 'var(--color-text-primary)'
        }}>
          💳 Transactions
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => openAddForm('credit')}
            className="btn btn-success"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> Add Credit
          </button>
          <button
            onClick={() => openAddForm('debit')}
            className="btn btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ fontSize: '1.2rem' }}>−</span> Add Debit
          </button>
        </div>
      </div>
      
      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card" style={{
          background: transactionType === 'credit' 
            ? 'linear-gradient(135deg, #d4f4dd 0%, #b8e6c3 100%)'
            : 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
          marginBottom: '2rem',
          border: '3px solid ' + (transactionType === 'credit' ? '#16a34a' : '#dc2626')
        }}>
          <h2 style={{ 
            marginBottom: '1.5rem',
            color: transactionType === 'credit' ? '#15803d' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            {editingId ? '✏️ Edit' : (transactionType === 'credit' ? '📈 Add Credit' : '📉 Add Debit')} Transaction
          </h2>
          
          <form onSubmit={handleSubmit}>
            {!editingId && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '700',
                  color: transactionType === 'credit' ? '#15803d' : '#991b1b'
                }}>
                  Transaction Type *
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setTransactionType('credit')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: 'var(--radius)',
                      border: transactionType === 'credit' ? '3px solid #16a34a' : '2px solid #cbd5e1',
                      background: transactionType === 'credit' ? '#16a34a' : 'white',
                      color: transactionType === 'credit' ? 'white' : '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    📈 Credit (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('debit')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: 'var(--radius)',
                      border: transactionType === 'debit' ? '3px solid #dc2626' : '2px solid #cbd5e1',
                      background: transactionType === 'debit' ? '#dc2626' : 'white',
                      color: transactionType === 'debit' ? 'white' : '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    📉 Debit (Expense)
                  </button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder={transactionType === 'credit' ? 'e.g., Salary, Freelance, Gift' : 'e.g., Groceries, Rent, Bills'}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label>Amount * (positive number only)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: transactionType === 'credit' ? '#16a34a' : '#dc2626'
                  }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                    style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '1.1rem', fontWeight: '600' }}
                  />
                </div>
                <small style={{ 
                  display: 'block', 
                  marginTop: '0.5rem', 
                  fontSize: '0.875rem',
                  color: transactionType === 'credit' ? '#15803d' : '#991b1b',
                  fontWeight: '600'
                }}>
                  {transactionType === 'credit' ? '✅ Will be added as income' : '✅ Will be deducted as expense'}
                </small>
              </div>
              
              <div>
                <label>Bank Account *</label>
                <select
                  value={formData.bank}
                  onChange={e => setFormData({...formData, bank: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
                >
                  <option value="">Select Bank</option>
                  {userBanks.sort((a, b) => a.code === 'cash' ? -1 : b.code === 'cash' ? 1 : 0).map(bank => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code === 'cash' ? '💰 ' : '🏦 '}{bank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                className="btn"
                style={{ 
                  flex: 1,
                  minWidth: '150px',
                  background: transactionType === 'credit' ? '#16a34a' : '#dc2626',
                  color: 'white',
                  fontWeight: '700'
                }}
              >
                {editingId ? '💾 Update' : (transactionType === 'credit' ? '+ Add Credit' : '− Add Debit')}
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '150px' }}
              >
                ✖ Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          color: 'white',
          boxShadow: '0 4px 6px rgba(22, 163, 74, 0.3)',
          border: 'none'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>📈 Total Credits</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {creditTransactions.length}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
            ₹{creditTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
          </div>
        </div>
        
        <div className="card" style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          color: 'white',
          boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
          border: 'none'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>📉 Total Debits</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {debitTransactions.length}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
            ₹{Math.abs(debitTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)).toFixed(2)}
          </div>
        </div>
        
        <div className="card" style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: 'white',
          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)',
          border: 'none'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>💰 Net Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {transactions.length}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
            ₹{transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Transactions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 Transaction History</h2>
          <p className="card-subtitle">
            {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {transactions.length === 0 ? (
          <div className="card-body" style={{ 
            textAlign: 'center', 
            padding: '3rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              No transactions yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
              Click "Add Credit" or "Add Debit" above to start tracking
            </p>
          </div>
        ) : (
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              {transactions.map(txn => {
                const amount = parseFloat(txn.amount);
                const isCredit = amount > 0;
                
                return (
                  <div
                    key={txn.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.5rem',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      borderLeft: '4px solid ' + (isCredit ? '#16a34a' : '#dc2626'),
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '600', 
                        fontSize: '1.1rem', 
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-primary)'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>
                          {isCredit ? '📈' : '📉'}
                        </span>
                        {txn.description}
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isCredit ? '#dcfce7' : '#fee2e2',
                          color: isCredit ? '#15803d' : '#991b1b',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {isCredit ? 'CREDIT' : 'DEBIT'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        📅 {txn.date} • {txn.bank === 'cash' ? '💰' : '🏦'} {txn.bank}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: 'bold',
                      color: isCredit ? '#16a34a' : '#dc2626',
                      marginRight: '1rem'
                    }}>
                      {isCredit ? '+' : '−'}₹{Math.abs(amount).toFixed(2)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(txn)}
                        className="btn btn-sm"
                        style={{ background: 'var(--color-primary)', color: 'white' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(txn.id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Delete
                      </button>
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

export default Transactions;
