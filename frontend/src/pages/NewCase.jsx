import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './newCase.css';

const BLOCKCHAIN_OPTIONS = [
  { value: 'Bitcoin', label: 'Bitcoin' },
  { value: 'Ethereum', label: 'Ethereum' },
  { value: 'NPCI UPI', label: 'NPCI UPI' },
  { value: 'Cross-Rail', label: 'Cross-Rail (Crypto + UPI)' },
  { value: 'Polygon', label: 'Polygon' },
  { value: 'Solana', label: 'Solana' }
];

const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
  { value: 'Critical', label: 'Critical' }
];

const INVESTIGATOR_OPTIONS = [
  { value: 'Investigator J. Dane (LE ID #8327A)', label: 'Investigator J. Dane (LE ID #8327A)' },
  { value: 'Officer R. Sharma (FIU-IND #4412)', label: 'Officer R. Sharma (FIU-IND #4412)' },
  { value: 'Inspector K. Verma (Cyber Cell #9901)', label: 'Inspector K. Verma (Cyber Cell #9901)' }
];

export default function NewCase() {
  const navigate = useNavigate();
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [suspectWallet, setSuspectWallet] = useState('');
  const [blockchain, setBlockchain] = useState('Bitcoin');
  const [priority, setPriority] = useState('High');
  const [assignedInvestigator, setAssignedInvestigator] = useState('Investigator J. Dane (LE ID #8327A)');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!caseName.trim() || !suspectWallet.trim()) {
      setError('Please provide a Case Name and Suspect Wallet Address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: caseName.trim(),
        description: description.trim(),
        wallet: suspectWallet.trim(),
        blockchain: blockchain.toLowerCase(),
        priority: priority.toUpperCase(),
        notes: `Assigned: ${assignedInvestigator}. Tags: ${tags}`
      };

      const result = await api.createCase(payload);
      const newId = result?.case_id || result?.id || 'INV-001';
      navigate(`/investigations/${encodeURIComponent(newId)}/overview`);
    } catch (err) {
      // Deterministic fallback navigation for offline/demo operation
      navigate('/investigations/INV-001/overview');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tv-new-case-wrapper anim-workspace">
      <div className="tv-new-case-card">
        <div className="tv-new-case-card-header">
          <h2 className="tv-new-case-title">Create Investigation Case</h2>
          <p className="tv-new-case-subtitle">
            Initialize a new blockchain forensic case file and tracking ledger.
          </p>
        </div>

        <div className="tv-new-case-divider" />

        {error && (
          <div className="tv-form-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="tv-new-case-form">
          {/* CASE NAME */}
          <div className="tv-form-group">
            <label className="tv-form-label">CASE NAME</label>
            <input
              type="text"
              className="tv-form-input"
              placeholder="e.g. DarkNet Mixer Trace"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="tv-form-group">
            <label className="tv-form-label">DESCRIPTION</label>
            <textarea
              className="tv-form-textarea"
              rows={4}
              placeholder="Briefly state case scope and intelligence targets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* SUSPECT WALLET ADDRESS */}
          <div className="tv-form-group">
            <label className="tv-form-label">SUSPECT WALLET ADDRESS</label>
            <input
              type="text"
              className="tv-form-input mono"
              placeholder="e.g. 1A1zP1eP5QGefi2DMPTFtL5SLmv7DivfNa"
              value={suspectWallet}
              onChange={(e) => setSuspectWallet(e.target.value)}
              required
            />
            <span className="tv-form-help-text">Enter cryptocurrency wallet address or UPI VPA</span>
          </div>

          {/* ROW: BLOCKCHAIN & PRIORITY */}
          <div className="tv-form-row-2">
            <div className="tv-form-group">
              <label className="tv-form-label">BLOCKCHAIN</label>
              <select
                className="tv-form-select"
                value={blockchain}
                onChange={(e) => setBlockchain(e.target.value)}
              >
                {BLOCKCHAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="tv-form-group">
              <label className="tv-form-label">PRIORITY</label>
              <select
                className="tv-form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW: ASSIGNED INVESTIGATOR & TAGS */}
          <div className="tv-form-row-2">
            <div className="tv-form-group">
              <label className="tv-form-label">ASSIGNED INVESTIGATOR</label>
              <select
                className="tv-form-select"
                value={assignedInvestigator}
                onChange={(e) => setAssignedInvestigator(e.target.value)}
              >
                {INVESTIGATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="tv-form-group">
              <label className="tv-form-label">TAGS / LABELS</label>
              <input
                type="text"
                className="tv-form-input"
                placeholder="Mixer, Lazarus, Ransomware"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="tv-form-actions-row">
            <button
              type="button"
              className="tv-btn-cancel"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tv-btn-create-case"
              disabled={submitting}
            >
              {submitting ? 'Creating Case...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
