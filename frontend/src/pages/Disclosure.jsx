import React, { useState } from 'react';
import { 
  Scale, 
  Search, 
  Plus, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Send
} from 'lucide-react';
import '../styles/tokens.css';
import './cases.css';

const SAMPLE_REQUISITIONS = [
  {
    id: 'REQ-2026-0881',
    caseId: 'CASE-2026-001',
    entityName: 'CoinDCX Compliance Desk',
    entityType: 'VASP (FIU-IND Registered)',
    statutoryBasis: 'Section 91 Cr.P.C. / PMLA Sec 12',
    dateIssued: '2026-02-14 10:15 UTC',
    status: 'TRANSMITTED',
    priority: 'HIGH',
    exhibitsCount: 3,
    walletTarget: '0x1a2b3c4d5e...f6789',
    demandedRecords: 'Full KYC dossier, beneficiary bank account linkage, withdrawal IPDR and MAC telemetry logs.',
    officer: 'IO S. Verma (Cyber Crime PS BLR)',
    tokenHash: '0x4f82a10b98c3...e12a',
  },
  {
    id: 'REQ-2026-0882',
    caseId: 'CASE-2026-001',
    entityName: 'Axis Bank P2P Operations',
    entityType: 'Scheduled Commercial Bank',
    statutoryBasis: 'Section 91 Cr.P.C.',
    dateIssued: '2026-02-14 11:30 UTC',
    status: 'ACKNOWLEDGED',
    priority: 'CRITICAL',
    exhibitsCount: 2,
    walletTarget: 'VPA: p2p_desk_blr@axis',
    demandedRecords: 'Account statement 2026-01-01 to date, linked PAN/Aadhaar references, mobile number change audit.',
    officer: 'IO S. Verma (Cyber Crime PS BLR)',
    tokenHash: '0x99cb1824aa39...b041',
  },
  {
    id: 'REQ-2026-0845',
    caseId: 'CASE-2026-002',
    entityName: 'WazirX Grievance & Legal',
    entityType: 'VASP (FIU-IND Registered)',
    statutoryBasis: 'Rule 3(1)(d) IT Intermediary Rules',
    dateIssued: '2026-02-10 14:00 UTC',
    status: 'FULFILLED',
    priority: 'MEDIUM',
    exhibitsCount: 4,
    walletTarget: '0x88fa3910b2...10b2',
    demandedRecords: 'Frozen asset custody confirmation, transaction ledger for INR-USDT book, account creation timestamp.',
    officer: 'Insp. R. Kulkarni (EOW Mumbai)',
    tokenHash: '0x18ac938475ef...9230',
  },
  {
    id: 'REQ-2026-0812',
    caseId: 'CASE-2026-003',
    entityName: 'State Bank of India Corporate',
    entityType: 'Scheduled Commercial Bank',
    statutoryBasis: 'Section 91 Cr.P.C.',
    dateIssued: '2026-02-08 09:20 UTC',
    status: 'FULFILLED',
    priority: 'HIGH',
    exhibitsCount: 1,
    walletTarget: 'VPA: traveler_mule_blr@sbi',
    demandedRecords: 'ATM withdrawal CCTV timestamps, branch account opening document bundle, UPI device ID binding.',
    officer: 'Sub-Insp. M. Das (CID Kolkata)',
    tokenHash: '0x77ee91284756...cc44',
  }
];

export default function Disclosure() {
  const [selectedReq, setSelectedReq] = useState(SAMPLE_REQUISITIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = SAMPLE_REQUISITIONS.filter((r) => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchSearch = !searchQuery ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.walletTarget.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="tv-cases-container">
      {/* Page Header */}
      <div className="tv-cases-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tv-badge" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', color: 'var(--accent-cyan)' }}>
              <Scale size={12} />
              SAHYOG ADAPTER · LEA STATUTORY REQUISITIONS
            </span>
            <span className="tv-badge tv-badge-mono">GATEWAY STATUS: ONLINE</span>
          </div>
          <h1 className="tv-cases-title">Disclosure / SAHYOG Console</h1>
          <p className="tv-cases-subtitle">
            Formal notices issued to Virtual Asset Service Providers (VASPs) and banking nodes under Section 91 Cr.P.C. and PMLA frameworks.
          </p>
        </div>

        <div className="tv-cases-header-actions">
          <button className="tv-btn-primary" title="Draft new formal requisition">
            <Plus size={14} />
            <span>Draft Requisition</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div className="tv-card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Requisitions</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {SAMPLE_REQUISITIONS.length}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Formal notices recorded</div>
        </div>

        <div className="tv-card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Response</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-high-text)', marginTop: '4px' }}>
            2
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Awaiting VASP / Bank action</div>
        </div>

        <div className="tv-card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fulfilled Dossiers</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-low-text)', marginTop: '4px' }}>
            2
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Admitted to Evidence Locker</div>
        </div>

        <div className="tv-card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Channel Encryption</div>
          <div className="mono" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '6px' }}>
            RSA-4096 / TLS 1.3
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>SAHYOG Intermediary Protocol</div>
        </div>
      </div>

      {/* Main Split Layout: Table on Left, Requisition Inspector on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' }}>
        {/* Left: Requisitions Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Controls Bar */}
          <div className="tv-cases-controls">
            <div className="tv-cases-search-box">
              <Search size={14} className="tv-cases-search-icon" />
              <input
                type="text"
                placeholder="Search requisition ID, case, entity, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tv-cases-search-input"
              />
            </div>

            <div className="tv-cases-filter-pills">
              {['ALL', 'TRANSMITTED', 'ACKNOWLEDGED', 'FULFILLED'].map((st) => (
                <button
                  key={st}
                  className={`tv-filter-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="tv-table-wrapper">
            <table className="tv-table">
              <thead>
                <tr>
                  <th>NOTICE ID</th>
                  <th>CASE REF</th>
                  <th>TARGET ENTITY</th>
                  <th>STATUTORY BASIS</th>
                  <th>ISSUED DATE</th>
                  <th>STATUS</th>
                  <th>EXHIBITS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isSelected = selectedReq.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReq(r)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--bg-elevated)' : undefined,
                        borderColor: isSelected ? 'var(--border-strong)' : undefined
                      }}
                    >
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {r.id}
                      </td>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                        {r.caseId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.entityName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.entityType}</div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {r.statutoryBasis}
                      </td>
                      <td className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.dateIssued}
                      </td>
                      <td>
                        <span className={`tv-badge ${
                          r.status === 'FULFILLED' ? 'tv-risk-low' :
                          r.status === 'ACKNOWLEDGED' ? 'tv-risk-medium' :
                          'tv-risk-high'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: 'center' }}>
                        {r.exhibitsCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="tv-card" style={{ padding: '16px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="tv-badge tv-badge-mono" style={{ color: 'var(--accent-cyan)' }}>
                {selectedReq.id}
              </span>
              <span className={`tv-badge ${
                selectedReq.status === 'FULFILLED' ? 'tv-risk-low' :
                selectedReq.status === 'ACKNOWLEDGED' ? 'tv-risk-medium' :
                'tv-risk-high'
              }`}>
                {selectedReq.status}
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedReq.entityName}
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {selectedReq.entityType} · {selectedReq.statutoryBasis}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                Case Reference
              </div>
              <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {selectedReq.caseId}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                Target Identifier (Wallet / VPA)
              </div>
              <div className="mono" style={{ 
                padding: '6px 8px', 
                backgroundColor: 'var(--bg-base)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                fontSize: '11px'
              }}>
                {selectedReq.walletTarget}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                Demanded Records
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '11.5px' }}>
                {selectedReq.demandedRecords}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                Requisitioning Officer
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {selectedReq.officer}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                Cryptographic Token Verification
              </div>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {selectedReq.tokenHash}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', gap: '8px' }}>
              <button className="tv-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={13} />
                <span>Export Notice PDF</span>
              </button>
              <button className="tv-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                <ExternalLink size={13} />
                <span>View Chain</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
