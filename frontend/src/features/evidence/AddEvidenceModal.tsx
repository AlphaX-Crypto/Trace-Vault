import React, { useState } from 'react';
import {
  EvidenceCategoryType,
  EvidenceRecord,
  EvidenceStatusType,
  SourceType
} from './evidenceTypes';

export interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvidence: (record: EvidenceRecord) => void;
  initialData?: Partial<EvidenceRecord>;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  onClose,
  onAddEvidence,
  initialData
}) => {
  const [category, setCategory] = useState<EvidenceCategoryType>(
    initialData?.category || 'OBSERVED_FACT'
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [source, setSource] = useState(initialData?.source || 'Authorized Transaction Feed');
  const [sourceType, setSourceType] = useState<SourceType>(
    initialData?.sourceType || 'UPI_FEED'
  );
  const [sourceReference, setSourceReference] = useState(initialData?.sourceReference || '');
  const [relatedCase, setRelatedCase] = useState(initialData?.caseId || 'CASE-2026-001');
  const [relatedObject, setRelatedObject] = useState(
    initialData?.relatedTransactionId || initialData?.relatedEntityId || ''
  );
  const [status, setStatus] = useState<EvidenceStatusType>(
    initialData?.status || 'REVIEW_REQUIRED'
  );
  const [investigatorNotes, setInvestigatorNotes] = useState(
    initialData?.investigatorNotes || ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title is required.');
      return;
    }
    if (!source.trim()) {
      setErrorMsg('Source is required.');
      return;
    }
    if (!relatedCase.trim()) {
      setErrorMsg('Related Case is required.');
      return;
    }

    const now = new Date();
    const isoString = now.toISOString();
    const displayTimestamp = `${isoString.slice(0, 10)} ${isoString.slice(11, 19)} UTC`;
    const randomId = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: EvidenceRecord = {
      id: randomId,
      caseId: relatedCase.trim(),
      category,
      title: title.trim(),
      description: description.trim() || 'Manual evidence record registered by investigator.',
      source: source.trim(),
      sourceType,
      sourceReference: sourceReference.trim() || undefined,
      observedAt: isoString,
      ingestedAt: isoString,
      timestamp: displayTimestamp,
      status,
      sourceIntegrity: 'SOURCE_AVAILABLE',
      relatedTransactionId: relatedObject.startsWith('0x') || relatedObject.startsWith('TX-') || relatedObject.startsWith('NEFT_') ? relatedObject.trim() : undefined,
      relatedEntityId: !relatedObject.startsWith('0x') && !relatedObject.startsWith('TX-') && relatedObject.trim() ? relatedObject.trim() : undefined,
      investigatorNotes: investigatorNotes.trim() || undefined,
      annotatedBy: 'Investigator Samarth',
      annotatedAt: displayTimestamp
    };

    onAddEvidence(newRecord);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-tag font-mono">INVESTIGATION EVIDENCE REGISTER</div>
            <h2 className="modal-title font-sans">Add Evidence Record</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Close Modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errorMsg && <div className="modal-error font-mono">{errorMsg}</div>}

          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label font-mono">EVIDENCE CATEGORY *</label>
            <div className="category-select-grid">
              {(
                [
                  { id: 'OBSERVED_FACT', label: 'Observed Fact', desc: 'Direct transaction, telemetry, or bank record' },
                  { id: 'SYSTEM_ANALYSIS', label: 'System Analysis', desc: 'Algorithm finding or multi-hop path calculation' },
                  { id: 'ATTRIBUTION_INDICATOR', label: 'Attribution Indicator', desc: 'Entity, VASP, or cluster association match' },
                  { id: 'RISK_INDICATOR', label: 'Risk Indicator', desc: 'Deterministic risk signal or policy violation' },
                  { id: 'INVESTIGATOR_INTERPRETATION', label: 'Investigator Note', desc: 'Hypothesis, analysis note, or memo' }
                ] as const
              ).map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`btn-category-select ${category === cat.id ? 'active' : ''}`}
                >
                  <span className="cat-name">{cat.label}</span>
                  <span className="cat-desc font-sans">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Case */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label font-mono">TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rapid UPI Pass-Through Dispersal (₹49,000.00)"
                className="modal-input font-sans"
                required
              />
            </div>

            <div className="form-group w-30">
              <label className="form-label font-mono">RELATED CASE *</label>
              <input
                type="text"
                value={relatedCase}
                onChange={(e) => setRelatedCase(e.target.value)}
                className="modal-input font-mono"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label font-mono">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the objective record, observation, or finding..."
              rows={2}
              className="modal-textarea font-sans"
            />
          </div>

          {/* Source & Source Type */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label font-mono">PROVENANCE SOURCE *</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Authorized Core Clearing Feed / Device Telemetry"
                className="modal-input font-sans"
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label font-mono">SOURCE TYPE</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className="modal-select font-mono"
              >
                <option value="UPI_FEED">UPI Transaction Feed</option>
                <option value="BLOCKCHAIN_LEDGER">Blockchain Ledger</option>
                <option value="VASP_REGISTRY">VASP Registry</option>
                <option value="GEOSPATIAL_SIGNAL">Geospatial Signal</option>
                <option value="RISK_ENGINE">Risk Analysis Engine</option>
                <option value="ATTRIBUTION_ENGINE">Attribution Engine</option>
                <option value="INVESTIGATOR_INPUT">Investigator Input</option>
                <option value="SYNTHETIC_DEMO">Synthetic Demo Dataset</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-mono">SOURCE REFERENCE (BLOCK # / UTR / NONCE)</label>
            <input
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g. Block #19820491, Nonce #42, UPI_REF_9182049281920"
              className="modal-input font-mono"
            />
          </div>

          {/* Related Object & Status */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label font-mono">RELATED OBJECT (TX HASH / VPA / WALLET)</label>
              <input
                type="text"
                value={relatedObject}
                onChange={(e) => setRelatedObject(e.target.value)}
                placeholder="e.g. TX-UPI-005, 0x71F9..., vpa98@okhdfcbank"
                className="modal-input font-mono"
              />
            </div>

            <div className="form-group w-35">
              <label className="form-label font-mono">EVIDENCE STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EvidenceStatusType)}
                className="modal-select font-mono"
              >
                <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="INSUFFICIENT_SUPPORT">INSUFFICIENT SUPPORT</option>
                <option value="DISPUTED">DISPUTED</option>
              </select>
            </div>
          </div>

          {/* Investigator Notes (Distinct Section) */}
          <div className="form-group">
            <div className="label-with-badge">
              <label className="form-label font-mono">INVESTIGATOR INTERPRETATION</label>
              <span className="note-distinction-badge font-mono">SEPARATE FROM OBSERVED FACTS</span>
            </div>
            <textarea
              value={investigatorNotes}
              onChange={(e) => setInvestigatorNotes(e.target.value)}
              placeholder="Enter investigative deductions, analytical context, or hypotheses. These will be labeled distinctly as investigator interpretations."
              rows={2}
              className="modal-textarea font-sans note-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-modal-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit font-mono">
              Add Evidence Record
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(4, 7, 12, 0.85);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .modal-card {
            width: 100%;
            max-width: 680px;
            max-height: 90vh;
            overflow-y: auto;
            background: #0f131a;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            padding: 24px 28px;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);
            color: #ffffff;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 16px;
            margin-bottom: 20px;
          }

          .modal-tag {
            font-size: 10px;
            color: #24c7c9;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }

          .modal-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
          }

          .btn-close-modal {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 16px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: color 0.15s ease;
          }

          .btn-close-modal:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
          }

          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .modal-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            color: #f87171;
            font-size: 12px;
            padding: 8px 12px;
            border-radius: 6px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .form-row {
            display: flex;
            gap: 14px;
          }

          .flex-1 {
            flex: 1;
          }

          .w-30 {
            width: 30%;
          }

          .w-35 {
            width: 35%;
          }

          .form-label {
            font-size: 10.5px;
            color: #94a3b8;
            letter-spacing: 0.04em;
          }

          .category-select-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .btn-category-select {
            background: #151b24;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 8px 12px;
            text-align: left;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 2px;
            transition: all 0.15s ease;
          }

          .btn-category-select:hover {
            border-color: rgba(255, 255, 255, 0.2);
            background: #1b232f;
          }

          .btn-category-select.active {
            background: rgba(36, 199, 201, 0.08);
            border-color: #24c7c9;
          }

          .btn-category-select .cat-name {
            font-size: 12px;
            font-weight: 600;
            color: #f1f5f9;
          }

          .btn-category-select.active .cat-name {
            color: #24c7c9;
          }

          .btn-category-select .cat-desc {
            font-size: 10px;
            color: #64748b;
          }

          .modal-input,
          .modal-textarea,
          .modal-select {
            background: #131821;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            font-size: 12.5px;
            padding: 8px 12px;
            border-radius: 6px;
            outline: none;
            transition: border-color 0.15s ease;
          }

          .modal-input:focus,
          .modal-textarea:focus,
          .modal-select:focus {
            border-color: #24c7c9;
          }

          .label-with-badge {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .note-distinction-badge {
            font-size: 9.5px;
            color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.25);
            padding: 2px 6px;
            border-radius: 4px;
          }

          .note-input {
            border-left: 3px solid #f59e0b;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 10px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .btn-modal-cancel {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #94a3b8;
            font-size: 12.5px;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn-modal-cancel:hover {
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.25);
            background: #151a22;
          }

          .btn-modal-submit {
            background: #24c7c9;
            border: none;
            color: #0b0f14;
            font-size: 12.5px;
            font-weight: 600;
            padding: 8px 18px;
            border-radius: 6px;
            cursor: pointer;
            transition: opacity 0.15s ease;
          }

          .btn-modal-submit:hover {
            opacity: 0.92;
          }
        `}</style>
      </div>
    </div>
  );
};
