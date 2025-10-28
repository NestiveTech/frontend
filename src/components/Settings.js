/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SETTINGS COMPONENT - Complete with Delete Account Feature
 * Features: Bank Management, Base Amounts, Rollover Month, Delete Account
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';

const Settings = ({ currentUser, apiCall, userBanks, loadBanks, spreadsheetUrl, setLoading }) => {
  const [settings, setSettings] = useState({});
  const [showAddBank, setShowAddBank] = useState(false);
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newBank, setNewBank] = useState({ name: '', code: '', color: '#2563eb' });
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load settings from backend
  const loadSettings = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getSettings');
      if (r.success && r.data) {
        console.log('Settings loaded:', r.data);
        setSettings(r.data);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle setting change
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Save all settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const r = await apiCall('updateSettings', settings);
      if (r.success) {
        alert('✅ Settings saved successfully!');
        await loadSettings();
        await loadBanks();
      } else {
        alert('❌ Failed to save: ' + r.error);
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add new bank
  const handleAddBank = async (e) => {
    e.preventDefault();
    
    if (!newBank.name || !newBank.code) {
      alert('⚠️ Please enter bank name and code');
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('addBank', {
        bankName: newBank.name,
        bankCode: newBank.code,
        bankColor: newBank.color
      });
      
      if (r.success) {
        alert('✅ Bank added successfully!');
        setNewBank({ name: '', code: '', color: '#2563eb' });
        setShowAddBank(false);
        await loadBanks();
        await loadSettings();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete bank
  const handleDeleteBank = async (bankCode) => {
    if (bankCode === 'cash') {
      alert('💰 Cash account cannot be deleted!');
      return;
    }
    
    if (!window.confirm(`⚠️ Delete ${bankCode}? This cannot be undone!`)) {
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('deleteBank', { bankCode });
      if (r.success) {
        alert('✅ Bank deleted!');
        await loadBanks();
        await loadSettings();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Rollover to next month
  const handleRolloverMonth = async () => {
    setLoading(true);
    try {
      const r = await apiCall('rolloverMonth');
      
      if (r.success) {
        const details = Object.keys(r.results)
          .map(code => {
            const bank = r.results[code];
            return `${bank.name}: ₹${bank.newPrevious.toFixed(2)}`;
          })
          .join('\n');
        
        alert(`✅ ${r.message}\n\nNew Previous Balances:\n${details}`);
        
        await loadSettings();
        await loadBanks();
        setShowRolloverModal(false);
      } else {
        alert('❌ Rollover failed: ' + r.error);
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('⚠️ Please type DELETE to confirm');
      return;
    }
    
    const finalConfirm = window.confirm(
      '⚠️ FINAL WARNING!\n\n' +
      'This will permanently delete:\n' +
      '• Your Google Spreadsheet\n' +
      '• All transactions\n' +
      '• All bank accounts\n' +
      '• All settings\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Click OK to proceed with deletion.'
    );
    
    if (!finalConfirm) {
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('deleteAccount');
      
      if (r.success) {
        alert('✅ ' + r.message + '\n\nYou will be logged out now.');
        
        // Clear local storage and reload
        localStorage.removeItem('balanceSheetUser');
        window.location.reload();
      } else {
        alert('❌ Failed to delete account: ' + r.error);
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="settings-page">
      {/* Page Header */}
      <h1 style={{ 
        marginBottom: '2rem', 
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        color: 'var(--color-text-primary)',
        fontWeight: '800'
      }}>
        ⚙️ Settings
      </h1>
      
      {/* Spreadsheet Link Card */}
      {spreadsheetUrl && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: '2rem',
          border: 'none'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            📊 Your Google Spreadsheet
          </div>
          <a 
            href={spreadsheetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn"
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              marginTop: '0.5rem',
              display: 'inline-flex',
              textDecoration: 'none'
            }}
          >
            📄 Open Spreadsheet →
          </a>
        </div>
      )}
      
      {/* Salary Settings */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">💰 Salary Settings</h2>
          <p className="card-subtitle">Set your monthly income</p>
        </div>
        
        <div className="card-body">
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: 'var(--color-text-secondary)'
          }}>
            Monthly Salary Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.salary_amount || 0}
            onChange={e => handleSettingChange('salary_amount', e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
            placeholder="Enter monthly salary"
          />
        </div>
      </div>
      
      {/* Bank Accounts Management */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title">🏦 Bank Accounts</h2>
            <p className="card-subtitle">Manage your bank accounts</p>
          </div>
          <button
            onClick={() => setShowAddBank(!showAddBank)}
            className="btn btn-primary"
          >
            {showAddBank ? '✖ Cancel' : '+ Add Bank'}
          </button>
        </div>
        
        {/* Add Bank Form */}
        {showAddBank && (
          <form onSubmit={handleAddBank} style={{
            background: 'var(--color-bg)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-border)'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
              Add New Bank Account
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label>Bank Name *</label>
                <input
                  type="text"
                  value={newBank.name}
                  onChange={e => setNewBank({...newBank, name: e.target.value})}
                  placeholder="e.g., State Bank of India, HDFC"
                  required
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label>Bank Code * (lowercase, no spaces)</label>
                <input
                  type="text"
                  value={newBank.code}
                  onChange={e => setNewBank({...newBank, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                  placeholder="e.g., sbi, hdfc, icici"
                  required
                  style={{ width: '100%' }}
                />
                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-text-light)' }}>
                  Only lowercase letters and numbers allowed
                </small>
              </div>
              
              <div>
                <label>Theme Color</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={newBank.color}
                    onChange={e => setNewBank({...newBank, color: e.target.value})}
                    style={{ width: '100px', height: '45px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                    Choose a color to identify this bank
                  </span>
                </div>
              </div>
            </div>
            
            <button type="submit" className="btn btn-success" style={{ marginTop: '1rem' }}>
              ✓ Add Bank Account
            </button>
          </form>
        )}
        
        {/* Bank List */}
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {userBanks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--color-text-light)'
              }}>
                <p>No bank accounts configured yet.</p>
              </div>
            ) : (
              userBanks.sort((a, b) => a.code === 'cash' ? -1 : b.code === 'cash' ? 1 : 0).map(bank => (
                <div
                  key={bank.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius)',
                    borderLeft: '4px solid ' + bank.color,
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '1.1rem',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: 'var(--color-text-primary)'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {bank.code === 'cash' ? '💰' : '🏦'}
                      </span>
                      {bank.name}
                      {bank.code === 'cash' && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.6rem',
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Default
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--color-text-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: bank.color
                      }}></span>
                      Code: <strong>{bank.code}</strong>
                    </div>
                  </div>
                  
                  {bank.code !== 'cash' && (
                    <button
                      onClick={() => handleDeleteBank(bank.code)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Bank Base Amounts */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">💼 Opening Balances</h2>
          <p className="card-subtitle">
            Set starting balances for each bank account. These will be added to your transaction totals.
          </p>
        </div>
        
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {userBanks.sort((a, b) => a.code === 'cash' ? -1 : b.code === 'cash' ? 1 : 0).map(bank => (
              <div
                key={bank.code}
                style={{
                  padding: '1.5rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '4px solid ' + bank.color
                }}
              >
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--color-text-primary)'
                }}>
                  {bank.code === 'cash' ? '💰' : '🏦'} {bank.name}
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem' 
                }}>
                  <div>
                    <label>Previous Month Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings[`previous_balance_${bank.code}`] || 0}
                      onChange={e => handleSettingChange(`previous_balance_${bank.code}`, e.target.value)}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                    <small style={{ 
                      display: 'block', 
                      marginTop: '0.5rem', 
                      color: 'var(--color-text-light)',
                      fontSize: '0.875rem'
                    }}>
                      Last month's closing balance
                    </small>
                  </div>
                  
                  <div>
                    <label>Monthly Salary Input (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings[`monthly_input_${bank.code}`] || 0}
                      onChange={e => handleSettingChange(`monthly_input_${bank.code}`, e.target.value)}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                    />
                    <small style={{ 
                      display: 'block', 
                      marginTop: '0.5rem', 
                      color: 'var(--color-text-light)',
                      fontSize: '0.875rem'
                    }}>
                      Monthly salary allocated to this account
                    </small>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'var(--color-card)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                    Total Opening Balance:
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    fontSize: '1.25rem', 
                    color: 'var(--color-primary)'
                  }}>
                    ₹{(
                      (parseFloat(settings[`previous_balance_${bank.code}`]) || 0) +
                      (parseFloat(settings[`monthly_input_${bank.code}`]) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Rollover Month Section */}
      <div className="card" style={{
        marginBottom: '2rem',
        border: '2px solid var(--color-warning)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>🔄</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              marginBottom: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--color-text-primary)'
            }}>
              Rollover to Next Month
            </h2>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '0.95rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Transfer current balances to next month's starting balances and reset monthly inputs
            </p>
          </div>
        </div>

        <div style={{
          background: '#fef3c7',
          padding: '1.25rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          border: '1px solid #fbbf24'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            color: '#92400e', 
            marginBottom: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ What happens during rollover:
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1.5rem',
            color: '#78350f',
            fontSize: '0.95rem',
            lineHeight: '1.8'
          }}>
            <li>Current balances → New "Previous Balance" for each bank</li>
            <li>All "Monthly Input" values reset to ₹0</li>
            <li>Transaction history is preserved for your records</li>
            <li>You can start fresh tracking for the new month</li>
          </ul>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius)'
        }}>
          <div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--color-text-light)', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              Last Rollover
            </div>
            <div style={{ 
              fontWeight: '700', 
              fontSize: '1.1rem',
              color: 'var(--color-text-primary)'
            }}>
              {settings.last_rollover_date 
                ? new Date(settings.last_rollover_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Never'}
            </div>
          </div>

          <div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--color-text-light)', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              Current Month
            </div>
            <div style={{ 
              fontWeight: '700', 
              fontSize: '1.1rem',
              color: 'var(--color-text-primary)'
            }}>
              {new Date().toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowRolloverModal(true)}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontSize: '1.05rem',
            fontWeight: '700',
            width: '100%',
            padding: '1rem'
          }}
        >
          🔄 Rollover to Next Month
        </button>

        {/* Rollover Confirmation Modal */}
        {showRolloverModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'var(--color-card)',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--color-border)'
            }}>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                fontSize: '1.75rem',
                fontWeight: '800',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '2rem' }}>🔄</span>
                Confirm Month Rollover
              </h2>
              
              <div style={{
                background: '#fef3c7',
                padding: '1.25rem',
                borderRadius: 'var(--radius)',
                marginBottom: '2rem',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ 
                  margin: 0, 
                  color: '#78350f', 
                  fontSize: '1rem',
                  lineHeight: '1.7'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.75rem' }}>
                    This will update all bank balances for the new month.
                  </strong>
                  Current balances will become starting balances.<br/>
                  Monthly inputs will reset to ₹0.
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleRolloverMonth}
                  className="btn"
                  style={{
                    flex: 1,
                    background: 'var(--color-warning)',
                    color: 'white',
                    fontWeight: '700',
                    minWidth: '140px'
                  }}
                >
                  ✅ Yes, Rollover
                </button>
                <button
                  onClick={() => setShowRolloverModal(false)}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    minWidth: '140px'
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Account - Danger Zone */}
      <div className="card" style={{
        marginBottom: '2rem',
        border: '2px solid #dc2626',
        background: '#fef2f2'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              marginBottom: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#dc2626'
            }}>
              Danger Zone - Delete Account
            </h2>
            <p style={{ 
              color: '#991b1b', 
              fontSize: '0.95rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        <div style={{
          background: '#fee2e2',
          padding: '1.25rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          border: '1px solid #fca5a5'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            color: '#991b1b', 
            marginBottom: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🗑️ What will be deleted:
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1.5rem',
            color: '#7f1d1d',
            fontSize: '0.95rem',
            lineHeight: '1.8'
          }}>
            <li>Your Google Spreadsheet (moved to trash)</li>
            <li>All bank accounts and settings</li>
            <li>All transaction history</li>
            <li>All opening balances and configurations</li>
            <li>Your user account from this application</li>
          </ul>
        </div>

        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1rem',
          border: '1px solid #fca5a5'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#991b1b', 
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            ℹ️ Note: Your Google Spreadsheet will be moved to Google Drive trash and can be recovered for 30 days.
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn"
          style={{
            background: '#dc2626',
            color: 'white',
            fontSize: '1.05rem',
            fontWeight: '700',
            width: '100%',
            padding: '1rem',
            border: 'none'
          }}
        >
          🗑️ Delete My Account
        </button>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'var(--color-card)',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '2px solid #dc2626'
            }}>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                Confirm Account Deletion
              </h2>
              
              <div style={{
                background: '#fee2e2',
                padding: '1.25rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
                border: '1px solid #fca5a5'
              }}>
                <p style={{ 
                  margin: 0, 
                  color: '#7f1d1d', 
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  fontWeight: '600'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                    This action is PERMANENT and IRREVERSIBLE!
                  </strong>
                  All your data will be deleted. Your spreadsheet will be moved to Google Drive trash.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '700',
                  color: '#991b1b'
                }}>
                  Type <code style={{ 
                    background: '#fee2e2',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: '700'
                  }}>DELETE</code> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  style={{ 
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1rem',
                    border: '2px solid #fca5a5',
                    borderRadius: 'var(--radius)',
                    textTransform: 'uppercase'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="btn"
                  style={{
                    flex: 1,
                    background: deleteConfirmText === 'DELETE' ? '#dc2626' : '#94a3b8',
                    color: 'white',
                    fontWeight: '700',
                    minWidth: '140px',
                    cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                    opacity: deleteConfirmText === 'DELETE' ? 1 : 0.6
                  }}
                >
                  ☠️ Yes, Delete Forever
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    minWidth: '140px'
                  }}
                >
                  ✖ Cancel
                </button>
              </div>

              <p style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: 'var(--color-text-light)',
                textAlign: 'center'
              }}>
                💡 Tip: You can recover the spreadsheet from Google Drive trash for 30 days
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Save Settings Button */}
      <div style={{
        position: 'sticky',
        bottom: '2rem',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,
        padding: '1rem 0'
      }}>
        <button
          onClick={handleSaveSettings}
          className="btn btn-success btn-lg"
          style={{
            fontSize: '1.15rem',
            padding: '1rem 3rem',
            boxShadow: '0 10px 25px rgba(16, 163, 74, 0.25)',
            fontWeight: '700'
          }}
        >
          💾 Save All Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
