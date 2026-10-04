import React, { useState, useEffect } from 'react';
import {
  IdentifierType,
  NewDisclosureRequestInput,
  RecipientType
} from './disclosureTypes';
import {
  AVAILABLE_EVIDENCE_CATALOG,
  LEGAL_BASIS_PRESETS,
  REQUESTED_INFO_PRESETS
} from './disclosureData';
import { mockSahyogAdapter } from './sahyogAdapter';

export interface CreateDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewDisclosureRequestInput) => void;
  initialData?: Partial<NewDisclosureRequestInput>;
  onNavigateToEvidence?: () => void;
}

export const CreateDisclosureModal: React.FC<CreateDisclosureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  onNavigateToEvidence
}) => {
  const [caseId, setCaseId] = useState(initialData?.caseId || 'CASE-2026-001');
  const [recipient, setRecipient] = useState(initialData?.recipient || 'Example Exchange');
  const [recipientType, setRecipientType] = useState<RecipientType>(
    initialData?.recipientType || 'VASP'
  );
  const [subjectIdentifier, setSubjectIdentifier] = useState(
    initialData?.subjectIdentifier || '0x71F9A6809403dE4B07B4f114B5C1089b0A124982'
  );
  const [identifierType, setIdentifierType] = useState<IdentifierType>(
    initialData?.identifierType || 'WALLET_ADDRESS'
  );
  const [requestType, setRequestType] = useState(
    initialData?.requestType || 'Customer / Account Information & Deposit Traces'
  );
  const [legalBasis, setLegalBasis] = useState(
    initialData?.legalBasis || LEGAL_BASIS_PRESETS[0]
  );
  const [customLegalBasis, setCustomLegalBasis] = useState('');
  const [isCustomLegalBasis, setIsCustomLegalBasis] = useState(false);

  const [requestPurpose, setRequestPurpose] = useState(
    initialData?.requestPurpose ||
      'Identification of beneficial account holder associated with candidate deposit cluster 9 and 42.50 ETH peeling flow.'
  );

  const [selectedInfo, setSelectedInfo] = useState<string[]>(
    initialData?.requestedInformation || [
      REQUESTED_INFO_PRESETS[0],
      REQUESTED_INFO_PRESETS[1],
      REQUESTED_INFO_PRESETS[2]
    ]
  );

  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>(
    initialData?.supportingEvidenceIds || ['EV-0001', 'EV-0003', 'EV-0005']
  );

  const [investigatorNotes, setInvestigatorNotes] = useState(
    initialData?.investigatorNotes || ''
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Synchronize when initialData changes (e.g. from VASP Attribution, Report, or Evidence prefill)
  useEffect(() => {
    if (initialData) {
      if (initialData.caseId) setCaseId(initialData.caseId);
      if (initialData.recipient) setRecipient(initialData.recipient);
      if (initialData.recipientType) setRecipientType(initialData.recipientType);
      if (initialData.subjectIdentifier) setSubjectIdentifier(initialData.subjectIdentifier);
      if (initialData.identifierType) setIdentifierType(initialData.identifierType);
      if (initialData.requestType) setRequestType(initialData.requestType);
      if (initialData.legalBasis) setLegalBasis(initialData.legalBasis);
      if (initialData.requestPurpose) setRequestPurpose(initialData.requestPurpose);
      if (initialData.requestedInformation) setSelectedInfo(initialData.requestedInformation);
      if (initialData.supportingEvidenceIds) setSelectedEvidenceIds(initialData.supportingEvidenceIds);
      if (initialData.investigatorNotes) setInvestigatorNotes(initialData.investigatorNotes);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const toggleInfoItem = (item: string) => {
    setSelectedInfo((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleEvidenceId = (evId: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(evId) ? prev.filter((id) => id !== evId) : [...prev, evId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeLegalBasis = isCustomLegalBasis ? customLegalBasis.trim() : legalBasis;

    const payload: NewDisclosureRequestInput = {
      caseId: caseId.trim(),
      recipient: recipient.trim(),
      recipientType,
      subjectIdentifier: subjectIdentifier.trim(),
      identifierType,
      requestType: requestType.trim(),
      legalBasis: activeLegalBasis,
      requestPurpose: requestPurpose.trim(),
      requestedInformation: selectedInfo,
      supportingEvidenceIds: selectedEvidenceIds,
      investigatorNotes: investigatorNotes.trim() || undefined
    };

    const validation = mockSahyogAdapter.validateRequest(payload);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay font-sans" onClick={onClose}>
      <div
        className="modal-card modal-disclosure-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header-row">
          <div>
            <div className="badge-row font-mono">
              <span className="modal-tag">SAHYOG SANDBOX REQUISITION</span>
              <span className="demo-data-badge">DEMO / SYNTHETIC DATA</span>
              <span className="sandbox-badge">SIMULATED ADAPTER</span>
            </div>
            <h2 className="modal-title font-sans">Create Disclosure Request</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="disclosure-form">
          {validationErrors.length > 0 && (
            <div className="validation-error-box font-mono">
              <span className="error-title">VALIDATION ERROR: MISSING REQUIRED FIELDS</span>
              <ul>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Target & Case Information */}
          <div className="form-section-title font-mono">1. RECIPIENT & SUBJECT IDENTIFIERS</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label font-mono">CASE IDENTIFIER *</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label font-mono">RECIPIENT / VASP NAME *</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Example Exchange, HDFC Settlement Node"
                className="form-input font-sans"
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label font-mono">RECIPIENT ENTITY TYPE *</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                className="form-select font-mono"
              >
                <option value="VASP">Virtual Asset Service Provider (VASP)</option>
                <option value="FINANCIAL_INSTITUTION">Domestic Financial Institution</option>
                <option value="PAYMENT_AGGREGATOR">Payment Aggregator / Gateways</option>
                <option value="TELECOM_PROVIDER">Authorized Telecom Operator</option>
                <option value="SERVICE_PROVIDER">Online Service Provider</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">IDENTIFIER TYPE *</label>
              <select
                value={identifierType}
                onChange={(e) => setIdentifierType(e.target.value as IdentifierType)}
                className="form-select font-mono"
              >
                <option value="WALLET_ADDRESS">Cryptocurrency Wallet Address</option>
                <option value="UPI_VPA">UPI Virtual Payment Address (VPA)</option>
                <option value="TRANSACTION_ID">Transaction Hash / UTR Reference</option>
                <option value="BANK_ACCOUNT_REF">Domestic Bank Account Reference</option>
                <option value="ENTITY_CLUSTER">Multi-Address Entity Cluster</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-mono">SUBJECT IDENTIFIER *</label>
            <input
              type="text"
              value={subjectIdentifier}
              onChange={(e) => setSubjectIdentifier(e.target.value)}
              placeholder="e.g. 0x71F9... or vpa98@okhdfcbank"
              className="form-input font-mono"
              required
            />
          </div>

          {/* Legal Authority & Purpose */}
          <div className="form-section-title font-mono" style={{ marginTop: '16px' }}>
            2. LEGAL BASIS & REQUISITION PURPOSE
          </div>

          <div className="form-group">
            <div className="legal-basis-header">
              <label className="form-label font-mono">LEGAL / AUTHORITY BASIS *</label>
              <button
                type="button"
                onClick={() => setIsCustomLegalBasis(!isCustomLegalBasis)}
                className="btn-toggle-custom font-sans"
              >
                {isCustomLegalBasis ? 'Select Preset Basis' : 'Enter Custom Legal Authority'}
              </button>
            </div>

            {isCustomLegalBasis ? (
              <input
                type="text"
                value={customLegalBasis}
                onChange={(e) => setCustomLegalBasis(e.target.value)}
                placeholder="Enter formal statutory section, judicial court order number, or legal decree..."
                className="form-input font-sans"
                required
              />
            ) : (
              <select
                value={legalBasis}
                onChange={(e) => setLegalBasis(e.target.value)}
                className="form-select font-sans"
              >
                {LEGAL_BASIS_PRESETS.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            )}

            <div className="field-disclaimer font-sans">
              <span className="disclaimer-k font-mono">LEGAL NOTICE:</span> Legal authority must be determined and validated by the authorized investigator or competent authority.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-mono">REQUEST PURPOSE & INVESTIGATIVE CONTEXT *</label>
            <textarea
              value={requestPurpose}
              onChange={(e) => setRequestPurpose(e.target.value)}
              rows={3}
              placeholder="Explain the factual investigation rationale, observed fund flow, and necessity for disclosure..."
              className="form-textarea font-sans"
              required
            />
          </div>

          {/* Requested Information Checklist */}
          <div className="form-section-title font-mono" style={{ marginTop: '16px' }}>
            3. REQUESTED INFORMATION CHECKLIST *
          </div>
          <div className="checklist-container font-sans">
            {REQUESTED_INFO_PRESETS.map((infoItem, idx) => {
              const isChecked = selectedInfo.includes(infoItem);
              return (
                <label key={idx} className={`checklist-item ${isChecked ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleInfoItem(infoItem)}
                  />
                  <span>{infoItem}</span>
                </label>
              );
            })}
            <div className="field-disclaimer font-sans">
              <span className="disclaimer-k font-mono">COMPLIANCE NOTICE:</span> The request is a structured investigative requisition. Recipient compliance is subject to applicable regulatory and jurisdictional frameworks.
            </div>
          </div>

          {/* Supporting Evidence References */}
          <div className="form-section-title font-mono" style={{ marginTop: '16px' }}>
            4. SUPPORTING INVESTIGATION EVIDENCE *
          </div>
          <div className="evidence-selector-grid font-sans">
            {AVAILABLE_EVIDENCE_CATALOG.map((ev) => {
              const isSelected = selectedEvidenceIds.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  onClick={() => toggleEvidenceId(ev.id)}
                  className={`evidence-select-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="ev-check-row">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="ev-id font-mono text-cyan">{ev.id}</span>
                    <span className="ev-cat font-mono">{ev.category}</span>
                  </div>
                  <div className="ev-title font-medium">{ev.title}</div>
                  <div className="ev-source font-mono text-muted">{ev.source}</div>
                </div>
              );
            })}
          </div>

          {onNavigateToEvidence && (
            <div className="evidence-link-row">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToEvidence();
                }}
                className="btn-link-evidence font-mono"
              >
                View Full Evidence Register in Workspace →
              </button>
            </div>
          )}

          {/* Optional Investigator Notes */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label font-mono">INVESTIGATOR MEMO / INTERNAL NOTES (OPTIONAL)</label>
            <textarea
              value={investigatorNotes}
              onChange={(e) => setInvestigatorNotes(e.target.value)}
              rows={2}
              placeholder="Internal investigator comments, coordination deadlines, or supervisor directives..."
              className="form-textarea font-sans"
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-bar">
            <button type="button" onClick={onClose} className="btn-cancel font-sans">
              Cancel
            </button>
            <button type="submit" className="btn-submit-draft font-sans">
              Save as Requisition Draft →
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .modal-disclosure-card {
          width: 860px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 24px 28px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.12);
          color: #0F172A;
        }

        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 20px;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 6px;
        }

        .modal-tag {
          font-size: 10.5px;
          font-weight: 600;
          color: #0369A1;
          background: #E0F2FE;
          border: 1px solid #BAE6FD;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .demo-data-badge {
          font-size: 10.5px;
          font-weight: 600;
          color: #92400E;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .sandbox-badge {
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .btn-close-modal {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s ease;
        }
        .btn-close-modal:hover {
          color: #0F172A;
        }

        .validation-error-box {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #991B1B;
          font-size: 12px;
        }
        .error-title {
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }
        .validation-error-box ul {
          margin: 0;
          padding-left: 18px;
        }

        .form-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.05em;
          padding-bottom: 6px;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 14px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 14px;
        }

        .form-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .form-input,
        .form-select,
        .form-textarea {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 8px 12px;
          color: #0F172A;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 1px #0284C7;
        }

        .legal-basis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-toggle-custom {
          background: transparent;
          border: none;
          color: #0284C7;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
        }

        .field-disclaimer {
          background: #FFFBEB;
          border-left: 3px solid #D97706;
          border: 1px solid #FEF3C7;
          border-left-width: 3px;
          border-left-color: #D97706;
          padding: 8px 12px;
          font-size: 12px;
          color: #78350F;
          margin-top: 6px;
          border-radius: 4px;
          line-height: 1.45;
        }
        .disclaimer-k {
          color: #B45309;
          font-weight: 700;
          margin-right: 4px;
        }

        .checklist-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #334155;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          transition: background 0.1s ease;
        }
        .checklist-item:hover {
          background: #F1F5F9;
        }
        .checklist-item.checked {
          color: #0F172A;
          font-weight: 500;
        }

        .evidence-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px;
        }

        .evidence-select-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .evidence-select-card:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }
        .evidence-select-card.selected {
          border-color: #0284C7;
          background: #F0F9FF;
        }

        .ev-check-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .ev-id {
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
        }

        .ev-cat {
          font-size: 10px;
          color: #64748B;
          background: #F1F5F9;
          padding: 1px 5px;
          border-radius: 3px;
        }

        .ev-title {
          font-size: 12px;
          font-weight: 600;
          color: #0F172A;
          line-height: 1.35;
        }

        .ev-source {
          font-size: 11px;
          color: #64748B;
          margin-top: 2px;
        }

        .evidence-link-row {
          margin-top: 6px;
        }

        .btn-link-evidence {
          background: transparent;
          border: none;
          color: #0284C7;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
        }

        .modal-actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #E2E8F0;
        }

        .btn-cancel {
          background: #FFFFFF;
          color: #475569;
          border: 1px solid #CBD5E1;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-cancel:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .btn-submit-draft {
          background: #0284C7;
          color: #FFFFFF;
          border: 1px solid #0284C7;
          padding: 8px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-submit-draft:hover {
          background: #0369A1;
        }
      `}</style>
    </div>
  );
};
