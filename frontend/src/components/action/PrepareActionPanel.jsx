import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Button from '../common/Button';
import ActionTypeSelector from './ActionTypeSelector';
import ActionBasis from './ActionBasis';
import EvidenceSelector from './EvidenceSelector';
import ActionReview from './ActionReview';
import DraftConfirmation from './DraftConfirmation';
import api from '../../services/api';

const defaultEvidence = ['EV-001', 'EV-003', 'EV-004', 'EV-005', 'EV-006'];

export default function PrepareActionPanel({ investigation, onClose }) {
  const { attribution, evidence } = investigation.intelligence;
  const [step, setStep] = useState('compose');
  const [actionType, setActionType] = useState('Disclosure Request');
  const [notes, setNotes] = useState(
    'Formal requisition under Section 91 CrPC for user identification and transaction logs associated with attributed deposit wallet.'
  );
  const [selected, setSelected] = useState(() =>
    defaultEvidence.filter((id) => evidence.some((item) => item.id === id))
  );
  const [submitting, setSubmitting] = useState(false);
  const [draftResult, setDraftResult] = useState(null);

  const closeRef = useRef(null);
  const target = attribution.entityName;
  const selectedEvidence = useMemo(
    () => evidence.filter((item) => selected.includes(item.id)),
    [evidence, selected]
  );

  useEffect(() => {
    closeRef.current?.focus();
    function escape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);

  function toggleEvidence(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function handleCreateDraft() {
    setSubmitting(true);
    try {
      const res = await api.createDisclosureRequest(investigation.id, {
        target_vasp: target || 'UNSPECIFIED_VASP',
        wallet_address: investigation.wallet,
        jurisdiction: 'INDIA_LEA',
        purpose: notes
      });
      setDraftResult(res);
      setStep('done');
    } catch (err) {
      console.error('Failed to create disclosure request on backend:', err);
      // Fallback gracefully so workflow continues
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="action-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="prepare-action"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prepare-action-title"
      >
        <header className="action-header">
          <div>
            <span>SAHYOG Adapter · LEA Requisition</span>
            <h2 id="prepare-action-title">Draft Section 91 CrPC Disclosure Request</h2>
            <p>
              Draft an official LEA information disclosure request targeting attributed VASP entity.
            </p>
          </div>
          <button ref={closeRef} type="button" aria-label="Close action workflow" onClick={onClose}>
            <X />
          </button>
        </header>

        {step === 'compose' && (
          <div className="action-content">
            <section className="action-target">
              <div>
                <span>01 · Target Entity</span>
                <strong>{target || 'No sufficiently attributed VASP'}</strong>
              </div>
              <dl>
                <div>
                  <dt>Attribution Confidence</dt>
                  <dd>{attribution.confidence}%</dd>
                </div>
                <div>
                  <dt>Association Type</dt>
                  <dd>{attribution.status}</dd>
                </div>
              </dl>
              {!attribution.hasProbableVasp && (
                <p>No sufficiently attributed VASP is available for a targeted action.</p>
              )}
            </section>
            <ActionTypeSelector value={actionType} onChange={setActionType} />
            <ActionBasis
              investigation={investigation}
              attribution={attribution}
              notes={notes}
              onNotesChange={setNotes}
            />
            <EvidenceSelector evidence={evidence} selected={selected} onToggle={toggleEvidence} />
          </div>
        )}

        {step === 'review' && (
          <ActionReview
            investigation={investigation}
            attribution={attribution}
            actionType={actionType}
            selectedCount={selectedEvidence.length}
            notes={notes}
          />
        )}

        {step === 'done' && (
          <DraftConfirmation
            actionType={actionType}
            target={target}
            selectedCount={selectedEvidence.length}
            draftResult={draftResult}
            onClose={onClose}
          />
        )}

        {step !== 'done' && (
          <footer>
            {step === 'review' ? (
              <Button variant="secondary" onClick={() => setStep('compose')}>
                <ArrowLeft /> Back
              </Button>
            ) : (
              <span>{selected.length} evidence records selected</span>
            )}
            <div>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {step === 'compose' ? (
                <Button
                  disabled={!notes.trim() || selected.length === 0}
                  onClick={() => setStep('review')}
                >
                  Review Action
                </Button>
              ) : (
                <Button disabled={submitting} onClick={handleCreateDraft}>
                  {submitting ? 'Drafting Request...' : 'Create Draft Request'}
                </Button>
              )}
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
