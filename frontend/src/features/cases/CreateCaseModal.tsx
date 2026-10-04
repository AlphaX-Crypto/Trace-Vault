import React, { useState } from 'react';

export interface CaseData {
  id: string;
  title: string;
  description: string;
  type: 'Crypto' | 'UPI' | 'Cross-Rail';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  targetIdentifier: string;
  status: 'Active' | 'Review' | 'Closed';
  updatedAt: string;
  createdAt: string;
  investigator: string;
}

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newCase: CaseData) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Crypto' | 'UPI' | 'Cross-Rail'>('Cross-Rail');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [targetIdentifier, setTargetIdentifier] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCase: CaseData = {
      id: `CASE-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      title: title.trim(),
      description: description.trim() || 'New investigation initiated for financial transaction analysis.',
      type,
      priority,
      targetIdentifier: targetIdentifier.trim() || '0x71F9A68...F84C2',
      status: 'Active',
      updatedAt: 'Just now',
      createdAt: '2026-09-29',
      investigator: 'Samarth'
    };

    onCreate(newCase);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">CASE REGISTRATION</span>
            <h2 id="modal-title" className="modal-title">Create New Investigation</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-close" aria-label="Close modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="case-title" className="form-label">Case Title</label>
            <input
              id="case-title"
              type="text"
              required
              placeholder="e.g. Cross-Rail Peeling Chain to Domestic VPA Sweep"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="case-type" className="form-label">Investigation Type</label>
              <select
                id="case-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="form-select"
              >
                <option value="Cross-Rail">Cross-Rail (Crypto + UPI)</option>
                <option value="Crypto">Crypto Wallet Tracing</option>
                <option value="UPI">UPI Fraud Detection</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="case-priority" className="form-label">Priority</label>
              <select
                id="case-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="form-select"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="case-target" className="form-label">Starting Identifier (Wallet / UPI)</label>
            <input
              id="case-target"
              type="text"
              placeholder="0x71F9A... or user@bank"
              value={targetIdentifier}
              onChange={(e) => setTargetIdentifier(e.target.value)}
              className="form-input font-mono"
            />
          </div>

          <div className="form-group">
            <label htmlFor="case-desc" className="form-label">Description / Matter Summary</label>
            <textarea
              id="case-desc"
              rows={3}
              placeholder="Initial complaint details, referral source, or flagged transaction timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Case →
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 12, 16, 0.78);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 24px;
        }

        .modal-card {
          width: 100%;
          max-width: 520px;
          background: #13161b;
          border: 1px solid #232830;
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #232830;
          padding-bottom: 16px;
        }

        .modal-eyebrow {
          font-size: 11px;
          font-weight: 600;
          color: #24c7c9;
          letter-spacing: 0.12em;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 4px;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: #8e95a0;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }

        .btn-close:hover {
          color: #ffffff;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #cbd5e1;
        }

        .form-input, .form-select, .form-textarea {
          background: #0c0e12;
          border: 1px solid #232830;
          border-radius: 8px;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          padding: 10px 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: #24c7c9;
        }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid #232830;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid #232830;
          color: #8e95a0;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: 9999px;
          cursor: pointer;
        }

        .btn-cancel:hover {
          color: #ffffff;
          border-color: #3b424e;
        }

        .btn-submit {
          background: #24c7c9;
          color: #0c0e12;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 8px 22px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-submit:hover {
          background: #3ee8eb;
        }

        .font-mono {
          font-family: 'JetBrains Mono', SFMono-Regular, monospace;
        }
      `}</style>
    </div>
  );
};
