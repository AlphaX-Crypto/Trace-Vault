import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import SelectField from '../components/common/SelectField';
import TextareaField from '../components/common/TextareaField';
import api from '../services/api';
import './phase2.css';

const blockchainOptions = [
  { value: 'ethereum', label: 'Ethereum (Supported)' },
  { value: 'bitcoin', label: 'Bitcoin (Future Scope)' },
  { value: 'tron', label: 'Tron (Future Scope)' },
  { value: 'polygon', label: 'Polygon (Future Scope)' }
];

const priorityOptions = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'CRITICAL', label: 'Critical Priority' }
];

const crimeTypeOptions = [
  { value: 'GENERAL_INVESTIGATION', label: 'General Investigation' },
  { value: 'RANSOMWARE', label: 'Ransomware Extortion' },
  { value: 'CYBER_EXTORTION', label: 'Cyber Extortion' },
  { value: 'TERROR_FINANCING', label: 'Terror Financing' },
  { value: 'MONEY_LAUNDERING', label: 'Money Laundering / Layering' },
  { value: 'FINANCIAL_FRAUD', label: 'Financial Fraud' }
];

const initialForm = {
  title: '',
  crime_type: 'GENERAL_INVESTIGATION',
  priority: 'HIGH',
  blockchain: 'ethereum',
  wallet: '',
  hopDepth: '3',
  notes: ''
};

function validateWallet(wallet, blockchain) {
  const value = wallet.trim();
  if (!value) return 'Wallet address is required.';
  // Security guard against accidental private key or seed phrase paste
  if (/^[a-fA-F0-9]{64}$/.test(value)) {
    return 'Security Error: Input resembles a private key. TRACEVAULT never accepts private keys.';
  }
  if (value.split(/\s+/).length >= 12) {
    return 'Security Error: Input resembles a seed phrase. TRACEVAULT never accepts seed phrases.';
  }
  if (blockchain === 'ethereum' || blockchain === 'polygon') {
    return /^0x[a-fA-F0-9]{1,40}$/i.test(value) || /^[A-Z0-9_]{1,42}$/i.test(value)
      ? ''
      : 'Enter a valid address or test node identifier (e.g. 0x... or A).';
  }
  return '';
}

function getErrors(form) {
  return {
    title: form.title.trim() ? '' : 'Case title is required.',
    blockchain: form.blockchain ? '' : 'Blockchain ledger is required.',
    wallet: validateWallet(form.wallet, form.blockchain),
    hopDepth: Number(form.hopDepth) >= 1 && Number(form.hopDepth) <= 8 ? '' : 'Select a hop depth from 1 to 8.'
  };
}

export default function NewCase() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const errors = useMemo(() => getErrors(form), [form]);
  const isValid = !Object.values(errors).some(Boolean);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const blur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setServerError(null);

    try {
      // Dispatch real case creation to Express backend -> PostgreSQL
      const createdCase = await api.createCase({
        title: form.title.trim(),
        description: form.notes.trim(),
        crime_type: form.crime_type,
        priority: form.priority,
        subject_type: 'WALLET',
        blockchain: form.blockchain.toLowerCase(),
        subject_identifier: form.wallet.trim()
      });

      const caseId = createdCase.case_id;

      // Navigate to analysis progress with real case and parameters
      navigate(`/cases/${encodeURIComponent(caseId)}/analysis`, {
        state: {
          caseId,
          walletAddress: form.wallet.trim(),
          blockchain: form.blockchain.toLowerCase(),
          maxHops: parseInt(form.hopDepth, 10) || 3
        }
      });
    } catch (err) {
      console.error('Failed to create case:', err);
      setServerError(err.message || 'Failed to create case on backend server.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="phase-heading">
        <div>
          <Link to="/cases" className="back-link">
            <ArrowLeft aria-hidden="true" /> Cases
          </Link>
          <h1>New investigation</h1>
          <p>Register an investigation case and configure parameters for transaction graph traversal.</p>
        </div>
        <span className="phase-marker mono">CASE INTAKE / 01</span>
      </div>

      {serverError && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger, #ef4444)',
          borderRadius: '4px',
          color: 'var(--color-danger, #ef4444)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle />
          <span>{serverError}</span>
        </div>
      )}

      <form className="case-form" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="section-index mono">01</div>
          <div className="section-intro">
            <h2>Case information</h2>
            <p>Law enforcement case classification and operational priority.</p>
          </div>
          <div className="form-fields two-column">
            <FormField
              id="case-title"
              name="title"
              label="Case title"
              placeholder="e.g. Operation RansomSweep - Cluster Tracing"
              value={form.title}
              onChange={update}
              onBlur={blur}
              error={touched.title ? errors.title : ''}
              required
              autoFocus
            />
            <SelectField
              id="priority"
              name="priority"
              label="Investigation priority"
              options={priorityOptions}
              value={form.priority}
              onChange={update}
            />
            <SelectField
              id="crime_type"
              name="crime_type"
              label="Offense category"
              options={crimeTypeOptions}
              value={form.crime_type}
              onChange={update}
              className="span-two"
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-index mono">02</div>
          <div className="section-intro">
            <h2>Target wallet</h2>
            <p>Select ledger and enter the suspect address or initial tracing seed.</p>
          </div>
          <div className="form-fields target-fields">
            <SelectField
              id="blockchain"
              name="blockchain"
              label="Blockchain network"
              options={blockchainOptions}
              value={form.blockchain}
              onChange={update}
              onBlur={blur}
              error={touched.blockchain ? errors.blockchain : ''}
              required
            />
            <FormField
              id="wallet"
              name="wallet"
              label="Suspect wallet address"
              placeholder="0x0000000000000000000000000000000000000001"
              value={form.wallet}
              onChange={update}
              onBlur={blur}
              error={touched.wallet ? errors.wallet : ''}
              hint="Enter public address or test node. Private keys and seeds are strictly prohibited."
              required
              className="wallet-field mono-input"
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-index mono">03</div>
          <div className="section-intro">
            <h2>Trace parameters</h2>
            <p>Define graph exploration limits for NetworkX BFS traversal.</p>
          </div>
          <div className="form-fields two-column">
            <SelectField
              id="hop-depth"
              name="hopDepth"
              label="Max BFS hop depth"
              options={Array.from({ length: 5 }, (_, index) => ({
                value: String(index + 1),
                label: `${index + 1} ${index === 0 ? 'hop' : 'hops'}`
              }))}
              value={form.hopDepth}
              onChange={update}
              onBlur={blur}
              error={touched.hopDepth ? errors.hopDepth : ''}
              required
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-index mono">04</div>
          <div className="section-intro">
            <h2>Investigator notes</h2>
            <p>Preliminary scope, crime branch incident reference, or complaint details.</p>
          </div>
          <div className="form-fields">
            <TextareaField
              id="notes"
              name="notes"
              label="Case background / notes"
              placeholder="Document the investigative context and specific fraud allegations…"
              value={form.notes}
              onChange={update}
              rows={4}
            />
          </div>
        </section>

        <div className="authorization-notice">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Authoritative Investigation Gateway</strong>
            <p>
              Case creation writes authoritatively to PostgreSQL. Wallet analysis will invoke the
              Python NetworkX Intelligence Engine and VASP attribution engine.
            </p>
          </div>
          <Info aria-hidden="true" />
        </div>

        <footer className="form-actions">
          <Link className="button button-secondary" to="/cases">
            Cancel
          </Link>
          <Button type="submit" disabled={!isValid || submitting}>
            {submitting ? 'Registering Case...' : 'Create Case & Begin Tracing'}{' '}
            <ArrowRight aria-hidden="true" />
          </Button>
        </footer>
      </form>
    </>
  );
}
