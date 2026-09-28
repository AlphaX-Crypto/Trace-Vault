import { CheckCircle2 } from 'lucide-react';

export default function DraftConfirmation({ actionType, target, selectedCount, draftResult, onClose }) {
  const reqId = draftResult?.request_id || draftResult?.id || null;
  const status = draftResult?.status || 'DRAFTED_PENDING_DISPATCH';

  return (
    <div className="draft-confirmation">
      <CheckCircle2 aria-hidden="true" />
      <span>SAHYOG Adapter Sandbox</span>
      <h3>Section 91 CrPC Draft Created</h3>
      {reqId && (
        <p className="mono" style={{ color: 'var(--text-heading)', fontWeight: 600 }}>
          {reqId}
        </p>
      )}
      <p>Drafted record persisted in PostgreSQL under case audit schedule.</p>
      <dl>
        <div>
          <dt>Action Type</dt>
          <dd>{actionType}</dd>
        </div>
        <div>
          <dt>Target VASP</dt>
          <dd>{target || 'Unspecified VASP'}</dd>
        </div>
        <div>
          <dt>Evidence Attached</dt>
          <dd>{selectedCount} records</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className="mono">{status}</dd>
        </div>
      </dl>
      <button className="button button-primary" type="button" onClick={onClose}>
        Return to Report
      </button>
    </div>
  );
}
