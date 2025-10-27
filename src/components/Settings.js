import React, { useState, useEffect } from 'react';

const Settings = ({ currentUser, apiCall, userBanks, loadBanks, spreadsheetUrl, setLoading }) => {
  const [settings, setSettings] = useState({ salary_amount: 0 });
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bankName: '', bankCode: '', bankColor: '#16a34a' });
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    setLoading(true);
    try {
      const r = await apiCall('getSettings');
      if (r.success && r.data) {
        setSettings(r.data);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const params = { salary_amount: settings.salary_amount };
      userBanks.forEach(b => {
        params[`monthly_input_${b.code}`] = settings[`monthly_input_${b.code}`] || 0;
      });
      
      const r = await apiCall('updateSettings', params);
      if (r.success) {
        alert('✅ Settings saved!');
        await loadSettings();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddBank = async (e) => {
    e.preventDefault();
    
    if (!newBank.bankName || !newBank.bankCode) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const r = await apiCall('addBank', newBank);
      if (r.success) {
        alert('✅ Bank added!');
        setNewBank({ bankName: '', bankCode: '', bankColor: '#16a34a' });
        setShowAddBank(false);
        await loadBanks();
        await loadSettings();
      } else {
        alert('❌ ' + r.error);
      }
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>⚙️ Settings</h1>
      
      {/* Financial Settings */}
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>💰 Financial Settings</h2>
        <form onSubmit={handleSaveSettings}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Monthly Salary
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.salary_amount || ''}
              onChange={e => setSettings({...settings, salary_amount: e.target.value})}
              placeholder="Enter your monthly salary (e.g., 50000.00)"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            />
          </div>
          {/* NEW: Cash Monthly Input Section */}
<div style={{
  background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
  padding: '1.5rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  border: '2px solid #fdcb6e'
}}>
  <label style={{
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#2d3436'
  }}>
    💰 Cash - Monthly Input
  </label>
  <input
    type="number"
    step="0.01"
    value={settings.monthly_input_cash || ''}
    onChange={e => setSettings({
      ...settings,
      monthly_input_cash: e.target.value
    })}
    placeholder="Enter monthly cash amount (e.g., 5000.00)"
    style={{
      width: '100%',
      padding: '0.875rem',
      borderRadius: '8px',
      border: '2px solid #2d3436',
      fontSize: '1rem',
      fontWeight: '600'
    }}
  />
  <small style={{
    display: 'block',
    marginTop: '0.5rem',
    color: '#2d3436',
    fontSize: '0.875rem'
  }}>
    ⭐ Cash is always available and cannot be deleted
  </small>
</div>

          {userBanks.map(bank => (
            <div key={bank.code} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                {bank.name} - Monthly Input
              </label>
              <input
                type="number"
                step="0.01"
                value={settings[`monthly_input_${bank.code}`] || ''}
                onChange={e => setSettings({
                  ...settings, 
                  [`monthly_input_${bank.code}`]: e.target.value
                })}
                placeholder={`Monthly amount for ${bank.name} (e.g., 10000.00)`}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
          ))}
          
          <button type="submit" className="btn btn-success">
            💾 Save Settings
          </button>
        </form>
      </div>
      
      {/* Manage Banks */}
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '1.5rem',
          alignItems: 'center'
        }}>
          <h2>🏦 Manage Banks</h2>
          <button 
            onClick={() => setShowAddBank(!showAddBank)} 
            className="btn btn-primary btn-sm"
          >
            {showAddBank ? '✖ Cancel' : '➕ Add Bank'}
          </button>
        </div>
        
        {showAddBank && (
          <form onSubmit={handleAddBank} style={{ 
            background: '#f8fafc', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={newBank.bankName}
                  onChange={e => setNewBank({...newBank, bankName: e.target.value})}
                  placeholder="Enter bank name (e.g., Cash, SBI Bank, HDFC)"
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
                  Bank Code *
                </label>
                <input
                  type="text"
                  value={newBank.bankCode}
                  onChange={e => setNewBank({...newBank, bankCode: e.target.value.toLowerCase()})}
                  placeholder="Enter unique code (e.g., cash, sbi, hdfc)"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Use lowercase letters only, no spaces
                </small>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Color
                </label>
                <input
                  type="color"
                  value={newBank.bankColor}
                  onChange={e => setNewBank({...newBank, bankColor: e.target.value})}
                  style={{ width: '100px', height: '40px', cursor: 'pointer' }}
                />
                <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Choose a color to identify this bank
                </small>
              </div>
            </div>
            
            <button type="submit" className="btn btn-success" style={{ marginTop: '1rem' }}>
              ➕ Add Bank
            </button>
          </form>
        )}
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {userBanks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#64748b' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
              <p>No banks added yet</p>
              <p style={{ fontSize: '0.875rem' }}>Click "Add Bank" to create your first bank account</p>
            </div>
          ) : (
            userBanks.map(bank => (
              <div key={bank.code} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: bank.color,
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>{bank.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {bank.code}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Spreadsheet Link */}
      {spreadsheetUrl && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <a 
            href={spreadsheetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            📊 Open Google Sheet
          </a>
          <p style={{ 
            marginTop: '1rem', 
            color: '#64748b', 
            fontSize: '0.875rem' 
          }}>
            View and manage your data directly in Google Sheets
          </p>
        </div>
      )}
      
      {/* Account Info */}
      {currentUser && (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>👤 Account Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>Email:</span>
              <span>{currentUser.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>Name:</span>
              <span>{currentUser.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>Status:</span>
              <span style={{ color: '#16a34a', fontWeight: '600' }}>✅ Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
