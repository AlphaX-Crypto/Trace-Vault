import React, { useState, useMemo, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';

export interface TransactionItem {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  rail: 'Ethereum' | 'Tron' | 'UPI Domestic' | 'Bitcoin';
  direction: 'Incoming' | 'Outgoing';
  timestamp: string;
  status: 'Flagged' | 'Confirmed' | 'Under Review';
  relatedCase: string;
  relatedEntities: string[];
  blockOrUtr?: string;
}

export interface TransactionExplorerProps {
  activeCaseId?: string;
  onBack: () => void;
  onViewInGraph: (tx: TransactionItem) => void;
  onOpenRisk?: () => void;
  onOpenUPI?: () => void;
  onOpenEvidence?: () => void;
  initialSearchHash?: string;
  txOriginTab?: string;
  onClearTxFilter?: () => void;
}

const SAMPLE_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'TX-001',
    hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
    from: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    to: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    amount: '42.50 ETH',
    asset: 'ETH',
    rail: 'Ethereum',
    direction: 'Outgoing',
    timestamp: '2026-09-29 08:14:22 UTC',
    status: 'Flagged',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['Suspect Wallet', 'Intermediary A'],
    blockOrUtr: 'Block #20914820'
  },
  {
    id: 'TX-002',
    hash: '0x94pd3819fa821c90038Fe942dF4426511aF890987',
    from: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    to: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
    amount: '30.00 ETH',
    asset: 'ETH',
    rail: 'Ethereum',
    direction: 'Outgoing',
    timestamp: '2026-09-29 08:22:45 UTC',
    status: 'Flagged',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['Intermediary A', 'Intermediary B'],
    blockOrUtr: 'Block #20914845'
  },
  {
    id: 'TX-003',
    hash: '0x039d91838cf419208472532410a0a5417bBc9800',
    from: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    to: '0xD42A1E09489403dE4B07B4f114B5C1089b0A124982',
    amount: '12.50 ETH',
    asset: 'ETH',
    rail: 'Ethereum',
    direction: 'Outgoing',
    timestamp: '2026-09-29 08:25:10 UTC',
    status: 'Confirmed',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['Intermediary A', 'Intermediary C'],
    blockOrUtr: 'Block #20914852'
  },
  {
    id: 'TX-004',
    hash: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
    from: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
    to: '0x92DE8C11A79403dE4B07B4f114B5C1089b0A124982',
    amount: '30.00 ETH',
    asset: 'ETH',
    rail: 'Ethereum',
    direction: 'Outgoing',
    timestamp: '2026-09-29 08:35:00 UTC',
    status: 'Flagged',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['Intermediary B', 'Mixer Deposit Pool'],
    blockOrUtr: 'Block #20914880'
  },
  {
    id: 'TX-005',
    hash: 'TRC20_721629e5039E6103Ac3e16441b45502b4917C590',
    from: '0x18D502bfa4917C59039E6103Ac3e16441b45502b',
    to: 'vpa98@okhdfcbank',
    amount: '85,000 USDT (~₹71.4L)',
    asset: 'USDT',
    rail: 'Tron',
    direction: 'Outgoing',
    timestamp: '2026-09-29 09:10:14 UTC',
    status: 'Under Review',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['P2P OTC Desk', 'Intermediary Account'],
    blockOrUtr: 'TRON #54198204'
  },
  {
    id: 'TX-006',
    hash: 'UPI_REF_9182390192849102830192',
    from: 'vpa98@okhdfcbank',
    to: 'HDFC Bank A/C 501004928192',
    amount: '₹53,00,000',
    asset: 'INR',
    rail: 'UPI Domestic',
    direction: 'Outgoing',
    timestamp: '2026-09-29 09:42:30 UTC',
    status: 'Flagged',
    relatedCase: 'CASE-2026-001',
    relatedEntities: ['Intermediary Account', 'Beneficiary Account'],
    blockOrUtr: 'UTR #881920384'
  }
];

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onViewInGraph,
  onOpenRisk,
  onOpenUPI,
  onOpenEvidence,
  initialSearchHash,
  txOriginTab,
  onClearTxFilter
}) => {
  const [search, setSearch] = useState(initialSearchHash || '');
  const [selectedRail, setSelectedRail] = useState('All');
  const [selectedDirection, setSelectedDirection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [evidenceAdded, setEvidenceAdded] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [transactionsList, setTransactionsList] = useState<TransactionItem[]>(SAMPLE_TRANSACTIONS);

  useEffect(() => {
    let isMounted = true;
    async function loadTransactions() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.get<any[]>(`/api/cases/${activeCaseId}/transactions`, { limit: 100 });
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: TransactionItem[] = res.data.map((t, idx) => ({
            id: t.tx_id || t.id || `TX-LIVE-${idx + 1}`,
            hash: t.tx_hash || t.transaction_hash || t.hash || 'N/A',
            from: t.from_address || t.from || 'N/A',
            to: t.to_address || t.to || 'N/A',
            amount: t.amount != null ? (typeof t.amount === 'number' ? `${t.amount} ${t.blockchain || ''}` : String(t.amount)) : '0.00',
            asset: t.blockchain === 'ethereum' ? 'ETH' : t.blockchain === 'tron' ? 'USDT' : t.blockchain === 'upi' ? 'INR' : 'CRYPTO',
            rail: t.blockchain === 'ethereum' ? 'Ethereum' : t.blockchain === 'tron' ? 'Tron' : t.blockchain === 'upi' ? 'UPI Domestic' : 'Bitcoin',
            direction: (t.direction as any) || 'Outgoing',
            timestamp: t.timestamp ? new Date(t.timestamp).toUTCString() : new Date().toUTCString(),
            status: t.status === 'flagged' ? 'Flagged' : t.status === 'under_review' ? 'Under Review' : 'Confirmed',
            relatedCase: activeCaseId,
            relatedEntities: t.metadata?.related_entities || ['Suspect Wallet'],
            blockOrUtr: t.metadata?.block_number ? `Block #${t.metadata.block_number}` : t.metadata?.utr ? `UTR #${t.metadata.utr}` : undefined
          }));
          setTransactionsList(mapped);
          setDataSource('LIVE_BACKEND');
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }
    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  const initialMatch = initialSearchHash
    ? transactionsList.find((tx) => tx.hash.toLowerCase().includes(initialSearchHash.toLowerCase()))
    : null;
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(initialMatch || transactionsList[0]);

  // Dynamic filter
  const filtered = useMemo(() => {
    return transactionsList.filter((tx) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        tx.hash.toLowerCase().includes(q) ||
        tx.from.toLowerCase().includes(q) ||
        tx.to.toLowerCase().includes(q) ||
        tx.amount.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q);

      const matchesRail = selectedRail === 'All' || tx.rail === selectedRail;
      const matchesDirection = selectedDirection === 'All' || tx.direction === selectedDirection;
      const matchesStatus = selectedStatus === 'All' || tx.status === selectedStatus;

      return matchesSearch && matchesRail && matchesDirection && matchesStatus;
    });
  }, [search, selectedRail, selectedDirection, selectedStatus]);

  // Keep selectedTx valid if filtered out
  const activeTx = useMemo(() => {
    if (selectedTx && filtered.some((t) => t.id === selectedTx.id)) {
      return selectedTx;
    }
    return filtered[0] || null;
  }, [selectedTx, filtered]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddEvidence = () => {
    setEvidenceAdded(true);
    setTimeout(() => setEvidenceAdded(false), 2500);
  };

  const formatAddress = (addr: string) => {
    if (addr.includes('@') || addr.includes('Bank')) return addr;
    if (addr.length > 20) return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    return addr;
  };

  const getStatusClass = (status: TransactionItem['status']) => {
    switch (status) {
      case 'Flagged':
        return 'status-badge-flagged';
      case 'Confirmed':
        return 'status-badge-confirmed';
      case 'Under Review':
        return 'status-badge-review';
      default:
        return 'status-badge-neutral';
    }
  };

  return (
    <div className="tx-workspace-root font-sans">
      {/* 1. Page Header */}
      <header className="tx-context-header">
        <div className="header-left">
          <nav className="breadcrumb-nav font-sans" aria-label="Breadcrumb">
            <button type="button" onClick={onBack} className="breadcrumb-link">
              Cases
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" onClick={onBack} className="breadcrumb-link">
              CASE-2026-001
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Transactions</span>
          </nav>
          <div className="header-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="page-main-title font-sans">Transactions</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: dataSource === 'LIVE_BACKEND' ? '#ECFDF5' : dataSource === 'BACKEND_UNAVAILABLE' ? '#FEF2F2' : '#F1F5F9',
                  color: dataSource === 'LIVE_BACKEND' ? '#047857' : dataSource === 'BACKEND_UNAVAILABLE' ? '#B91C1C' : '#475569',
                  border: `1px solid ${dataSource === 'LIVE_BACKEND' ? '#A7F3D0' : dataSource === 'BACKEND_UNAVAILABLE' ? '#FECACA' : '#CBD5E1'}`
                }}
              >
                {dataSource === 'LIVE_BACKEND' ? '● LIVE BACKEND' : dataSource === 'BACKEND_UNAVAILABLE' ? '✕ BACKEND OFFLINE (FIXTURE)' : '○ DEMO / SYNTHETIC'}
              </span>
            </div>
            <p className="page-main-sub font-sans">
              Review and inspect transaction activity associated with this investigation.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row">
            {onOpenUPI && (
              <button
                type="button"
                onClick={onOpenUPI}
                className="btn-secondary-action font-sans"
              >
                UPI Fraud Signals →
              </button>
            )}
            <button
              type="button"
              onClick={() => activeTx && onViewInGraph(activeTx)}
              className="btn-primary-action font-sans"
            >
              Inspect in Graph →
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body */}
      <main className="tx-main-content">
        {/* Banner when navigating directly to a specific transaction */}
        {initialSearchHash && (
          <div className="tx-banner-card font-sans">
            <div className="tx-banner-left">
              <span className="banner-tag font-sans">INSPECTING TRANSACTION</span>
              <span className="banner-hash font-mono">{initialSearchHash}</span>
              {txOriginTab && (
                <span className="banner-desc font-sans">
                  Referred from {txOriginTab} workspace findings.
                </span>
              )}
            </div>
            <div className="tx-banner-right">
              <button
                type="button"
                className="btn-secondary-action font-sans"
                onClick={() => {
                  setSearch('');
                  if (onClearTxFilter) onClearTxFilter();
                }}
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* 3. Summary Metric Row */}
        <section className="tx-summary-grid font-sans">
          <div className="count-card">
            <span className="count-label">Total Transactions</span>
            <span className="count-val">{SAMPLE_TRANSACTIONS.length}</span>
            <span className="count-sub">Cataloged Records</span>
          </div>
          <div className="count-card">
            <span className="count-label">Traced Volume</span>
            <span className="count-val">85.00 ETH Eq.</span>
            <span className="count-sub">Across Available Rails</span>
          </div>
          <div className="count-card">
            <span className="count-label">Flagged Transactions</span>
            <span className="count-val text-red">4</span>
            <span className="count-sub">Transactions Requiring Review</span>
          </div>
          <div className="count-card">
            <span className="count-label">Confirmed Transactions</span>
            <span className="count-val text-green">1</span>
            <span className="count-sub">Confirmed</span>
          </div>
          <div className="count-card">
            <span className="count-label">Under Review</span>
            <span className="count-val text-amber">1</span>
            <span className="count-sub">Pending Review</span>
          </div>
          <div className="count-card">
            <span className="count-label">Transaction Rails</span>
            <span className="count-val">3</span>
            <span className="count-sub">ETH, Tron, UPI</span>
          </div>
        </section>

        {/* 4. Filter and Search Controls Bar */}
        <section className="tx-controls-bar font-sans">
          <div className="search-input-wrap">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search tx hash, address, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-search-input font-sans"
            />
          </div>

          <div className="filter-select-group font-sans">
            <span className="filter-group-label">Rail:</span>
            <select
              value={selectedRail}
              onChange={(e) => setSelectedRail(e.target.value)}
              className="filter-select font-sans"
            >
              <option value="All">All Rails</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Tron">Tron</option>
              <option value="UPI Domestic">UPI Domestic</option>
            </select>

            <span className="filter-group-label" style={{ marginLeft: '6px' }}>Direction:</span>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="filter-select font-sans"
            >
              <option value="All">All Directions</option>
              <option value="Outgoing">Outgoing Only</option>
              <option value="Incoming">Incoming Only</option>
            </select>

            <span className="filter-group-label" style={{ marginLeft: '6px' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select font-sans"
            >
              <option value="All">All Statuses</option>
              <option value="Flagged">Flagged</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Under Review">Under Review</option>
            </select>

            {(search || selectedRail !== 'All' || selectedDirection !== 'All' || selectedStatus !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedRail('All');
                  setSelectedDirection('All');
                  setSelectedStatus('All');
                  if (onClearTxFilter) onClearTxFilter();
                }}
                className="btn-clear-filters font-sans"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* 5. Master-Detail Two Column Layout */}
        <div className="tx-grid">
          {/* Left Column: Transaction Register Table */}
          <div className="tx-register-col">
            <div className="clean-white-card table-card">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Transaction Register</h3>
                  <p className="card-sub-description font-sans">
                    Showing {filtered.length} of {SAMPLE_TRANSACTIONS.length} transactions recorded in this matter
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="tx-table font-sans">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Rail</th>
                      <th>Origin (From)</th>
                      <th>Destination (To)</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted font-sans">
                          No transactions match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((tx) => {
                        const isSelected = activeTx?.id === tx.id;
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className={`table-row ${isSelected ? 'row-selected' : ''}`}
                          >
                            <td className="font-mono text-muted text-xs">
                              {tx.timestamp.split(' ')[1]}
                            </td>
                            <td>
                              <span className="rail-pill font-sans">{tx.rail}</span>
                            </td>
                            <td className="font-mono text-secondary text-xs">
                              {formatAddress(tx.from)}
                            </td>
                            <td className="font-mono text-secondary text-xs">
                              {formatAddress(tx.to)}
                            </td>
                            <td className="font-mono font-medium text-xs">
                              {tx.amount}
                            </td>
                            <td>
                              <span className={`status-pill font-sans ${getStatusClass(tx.status)}`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Transaction Inspector */}
          <div className="tx-inspector-col">
            <aside className="clean-white-card inspector-card" aria-label="Transaction Inspector">
              {activeTx ? (
                <div className="inspector-content">
                  {/* Top Bar */}
                  <div className="inspector-header">
                    <div className="inspector-top-row">
                      <span className="inspector-id font-mono">{activeTx.id}</span>
                      <span className="rail-pill font-sans">{activeTx.rail}</span>
                      <span className={`status-pill font-sans ${getStatusClass(activeTx.status)}`}>
                        {activeTx.status}
                      </span>
                    </div>
                    <div className="inspector-hash-wrap">
                      <h2 className="inspector-title font-mono text-sm">{activeTx.hash}</h2>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeTx.hash, 'hash')}
                        className="btn-copy-chip font-sans"
                        title="Copy Hash"
                      >
                        {copiedField === 'hash' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="inspector-desc font-sans">
                      {activeTx.direction} transfer of {activeTx.amount} on {activeTx.rail} ledger.
                    </p>
                  </div>

                  {/* Transfer Details Section */}
                  <div className="inspector-section">
                    <div className="section-subtitle font-sans">Transfer Details</div>
                    <div className="meta-list font-sans">
                      <div className="meta-row">
                        <span className="meta-label">Origin Address</span>
                        <div className="meta-val-copy">
                          <span className="meta-val font-mono">{formatAddress(activeTx.from)}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeTx.from, 'from')}
                            className="btn-mini-copy"
                          >
                            {copiedField === 'from' ? '✓' : '⧉'}
                          </button>
                        </div>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Destination</span>
                        <div className="meta-val-copy">
                          <span className="meta-val font-mono">{formatAddress(activeTx.to)}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeTx.to, 'to')}
                            className="btn-mini-copy"
                          >
                            {copiedField === 'to' ? '✓' : '⧉'}
                          </button>
                        </div>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Traced Amount</span>
                        <span className="meta-val font-mono font-medium">{activeTx.amount}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Network Rail</span>
                        <span className="meta-val font-sans">{activeTx.rail}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Direction</span>
                        <span className="meta-val font-sans">{activeTx.direction}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Timestamp</span>
                        <span className="meta-val font-mono">{activeTx.timestamp}</span>
                      </div>
                      {activeTx.blockOrUtr && (
                        <div className="meta-row">
                          <span className="meta-label">Block / Clearing</span>
                          <span className="meta-val font-mono text-blue">{activeTx.blockOrUtr}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Investigative Context Section */}
                  <div className="inspector-section">
                    <div className="section-subtitle font-sans">Investigative Context</div>
                    <div className="meta-list font-sans">
                      <div className="meta-row">
                        <span className="meta-label">Case Identifier</span>
                        <span className="meta-val font-mono">{activeTx.relatedCase}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Associated Entities</span>
                        <div className="entities-chips-wrap">
                          {activeTx.relatedEntities.map((ent, idx) => (
                            <span key={idx} className="entity-chip font-sans">
                              {ent}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cross-Workspace Actions */}
                  <div className="inspector-actions">
                    <button
                      type="button"
                      onClick={() => onViewInGraph(activeTx)}
                      className="btn-cross-nav font-sans"
                    >
                      Inspect in Graph Workspace →
                    </button>
                    {onOpenRisk && (
                      <button
                        type="button"
                        onClick={onOpenRisk}
                        className="btn-cross-nav font-sans"
                      >
                        Analyze Risk Profile →
                      </button>
                    )}
                    {activeTx.rail === 'UPI Domestic' && onOpenUPI && (
                      <button
                        type="button"
                        onClick={onOpenUPI}
                        className="btn-cross-nav font-sans"
                      >
                        Inspect UPI Transaction Path →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="btn-secondary-action font-sans full-width"
                    >
                      {evidenceAdded ? '✓ Added to Case Evidence' : '+ Add to Case Evidence'}
                    </button>
                    {onOpenEvidence && (
                      <button
                        type="button"
                        onClick={onOpenEvidence}
                        className="btn-cross-nav font-sans"
                      >
                        View Case Evidence Register →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="inspector-empty font-sans">
                  <div className="empty-icon-wrap">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <h3 className="empty-title font-sans">No Transaction Selected</h3>
                  <p className="empty-desc font-sans">
                    Choose a transaction from the ledger to view cryptographic provenance and cross-workspace links.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <style>{`
        .tx-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
        }

        .tx-context-header {
          padding: 24px 32px 20px 32px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
          background: #ffffff;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          padding: 0;
          color: #2563eb;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: #94a3b8;
          font-size: 13px;
        }

        .breadcrumb-current {
          color: #64748b;
          font-weight: 500;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-main-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .page-main-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          max-width: 680px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .header-actions-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-primary-action {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-primary-action:hover {
          background: #1d4ed8;
        }

        .btn-secondary-action {
          background: #ffffff;
          color: #111827;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-secondary-action:hover {
          background: #f8fafc;
        }

        .btn-secondary-action.full-width {
          width: 100%;
          text-align: center;
        }

        .tx-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Banner Card */
        .tx-banner-card {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tx-banner-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .banner-tag {
          font-size: 11px;
          font-weight: 600;
          background: #2563eb;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }

        .banner-hash {
          font-size: 12.5px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .banner-desc {
          font-size: 12.5px;
          color: #3b82f6;
        }

        /* Summary Cards */
        .tx-summary-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .count-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .count-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .count-val {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .count-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        .text-red { color: #dc2626 !important; }
        .text-green { color: #16a34a !important; }
        .text-amber { color: #d97706 !important; }
        .text-blue { color: #2563eb !important; }

        /* Controls Bar */
        .tx-controls-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 12px;
          flex: 1;
          max-width: 440px;
        }

        .filter-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #111827;
          font-size: 13px;
          width: 100%;
        }

        .filter-search-input::placeholder {
          color: #94a3b8;
        }

        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-group-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .filter-select {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #111827;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          outline: none;
          cursor: pointer;
        }

        .filter-select:focus {
          border-color: #2563eb;
        }

        .btn-clear-filters {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11.5px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-clear-filters:hover {
          background: #f1f5f9;
          color: #111827;
        }

        /* Two-Column Master Detail */
        .tx-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 20px;
        }

        .clean-white-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .card-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .card-sub-description {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .tx-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .tx-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .tx-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .table-row:hover td {
          background-color: #f8fafc;
        }

        .table-row.row-selected td {
          background-color: #eff6ff;
        }

        .rail-pill {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 500;
          display: inline-block;
          white-space: nowrap;
        }

        .status-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .status-badge-flagged {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-badge-confirmed {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .status-badge-review {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fef3c7;
        }

        .status-badge-neutral {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        /* Inspector */
        .inspector-card {
          position: sticky;
          top: 24px;
        }

        .inspector-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .inspector-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .inspector-id {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .inspector-hash-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }

        .inspector-title {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          word-break: break-all;
        }

        .btn-copy-chip {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .btn-copy-chip:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .inspector-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }

        .inspector-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .section-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          gap: 12px;
        }

        .meta-label {
          color: #64748b;
          font-size: 12px;
          flex-shrink: 0;
        }

        .meta-val {
          color: #111827;
          text-align: right;
          font-size: 12px;
          white-space: nowrap;
        }

        .meta-val-copy {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-mini-copy {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          padding: 1px 3px;
        }

        .btn-mini-copy:hover {
          color: #0f172a;
        }

        .entities-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }

        .entity-chip {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .inspector-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .btn-cross-nav {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .btn-cross-nav:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .inspector-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          gap: 10px;
        }

        .empty-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .empty-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .empty-desc {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
          max-width: 260px;
        }

        @media (max-width: 1200px) {
          .tx-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .tx-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
