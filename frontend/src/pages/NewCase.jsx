import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import './NewCase.css';

const NewCase = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.startsWith('0x') || wallet.length !== 42) {
      alert('Please enter a valid Ethereum wallet address.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Mock API call to analyze wallet
      const res = await api.analyzeWallet({ case_id: `CASE-${Math.floor(Math.random() * 1000)}`, blockchain: 'ethereum', wallet_address: wallet });
      navigate(`/cases/${res.caseId}/analysis`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="new-case-container">
      <div className="new-case-header">
        <h2>New Investigation</h2>
        <p className="text-muted">Initialize tracing and attribution for a suspicious wallet.</p>
      </div>

      <div className="card new-case-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Blockchain Network</label>
              <select className="input-field" disabled defaultValue="ethereum">
                <option value="ethereum">Ethereum (Supported in Sprint 1)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Investigation Title (Optional)</label>
              <input type="text" className="input-field" placeholder="e.g. Stolen Funds Trace" />
            </div>
          </div>

          <div className="form-group full-width mt-4">
            <label>Suspicious Wallet Address <span className="required">*</span></label>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="input-field large mono" 
                placeholder="0x..." 
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="authorization-notice mt-6">
            <AlertTriangle size={18} className="notice-icon" />
            <p><strong>Authorization Notice:</strong> By initiating this analysis, you confirm that you have the appropriate authorization to query intelligence services for this entity.</p>
          </div>

          <div className="form-actions mt-6">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !wallet}>
              {isLoading ? 'INITIALIZING...' : 'START ANALYSIS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCase;
