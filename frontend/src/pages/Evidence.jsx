import React, { useState } from 'react';
import {
  Lock,
  Fingerprint,
  Link as LinkIcon,
  Gavel,
  Search,
  Plus,
  FileDown,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  GitBranch
} from 'lucide-react';
import './evidenceLocker.css';

const EXHIBITS = [
  {
    id: 'EX-01',
    title: 'Ledger Hop-Level Transaction Trail 84.70 ETH',
    meta: 'Ethereum Mainnet Blocks 19842100-19842188 · Corridor: BTC/ETH Bridge · Contract: Wasabi Mixer',
    format: '.JSON-LD',
    size: '4.2 MB',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    category: 'Blockchain Trails',
    leafIndex: '#04 of 14',
    hardwareSeal: 'YubiHSM2 #0x48FA99',
    timestamp: '2026-02-14 08:39:04 UTC'
  },
  {
    id: 'EX-02',
    title: 'Frankfurt Node PCAP Telemetry Dump (185.220.101.5)',
    meta: 'Capture Window: 48h Full Wire Packets · Layer-4 TCP Payloads & Wasabi CoinJoin Traffic',
    format: '.PCAPNG',
    size: '142.8 MB',
    hash: 'a89f33b1e7c913506bf87b99c099307ef117d91cb3229b46e382ff207b5a8e22',
    category: 'PCAP Dumps',
    leafIndex: '#05 of 14',
    hardwareSeal: 'YubiHSM2 #0x48FA99',
    timestamp: '2026-02-14 09:12:18 UTC'
  },
  {
    id: 'EX-03',
    title: 'KYC Dossier - Bharti Airtel Broadband CDR/IPDR',
    meta: 'Subscriber Leased Line CAF · S.91 CrPC Production Ref: CR-AIR-2026/884',
    format: '.PDF (Signed)',
    size: '18.4 MB',
    hash: '5d41402abc4b2a76b9719d911017ef8429abcc8042fa790b4d1c1a92fe12999f',
    category: 'KYC Extracts',
    leafIndex: '#06 of 14',
    hardwareSeal: 'YubiHSM2 #0x48FA99',
    timestamp: '2026-02-14 14:02:44 UTC'
  },
  {
    id: 'EX-04',
    title: 'Exchanged Deposit Wallet Cold Storage Signature',
    meta: 'Derivation Path m/44\'/60\'/0\'/0/1 ECDSA Secp256k1 Curve',
    format: '.BIN Raw',
    size: '1.1 MB',
    hash: '7f83b1657ff1fc53a80289128fef8231bc7891209ccbb01824efac028129bc88',
    category: 'Blockchain Trails',
    leafIndex: '#07 of 14',
    hardwareSeal: 'YubiHSM2 #0x48FA99',
    timestamp: '2026-02-14 19:44:01 UTC'
  },
  {
    id: 'EX-05',
    title: 'Smart Contract Decompiled Bytecode & Wasabi Pool',
    meta: 'Mixer Whirlpool Coordinator State Tree · EVM Storage Slot Audit',
    format: '.ZIP ARCHIVE',
    size: '36.9 MB',
    hash: 'bc425394f30e6ccdf328901467abfe1209bca3480182cfab8240ef11823ab81f',
    category: 'Blockchain Trails',
    leafIndex: '#08 of 14',
    hardwareSeal: 'YubiHSM2 #0x48FA99',
    timestamp: '2026-02-15 01:10:33 UTC'
  }
];

export default function Evidence() {
  const [selectedExhibit, setSelectedExhibit] = useState(EXHIBITS[0]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredExhibits = EXHIBITS.filter((item) => {
    const matchesCat = filterCategory === 'All' || item.category === filterCategory;
    const matchesQuery = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.hash.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="evidence-locker-page">
      {/* Top Banner matching screenshot */}
      <div className="evidence-header-banner">
        <div>
          <div className="evidence-header-badges">
            <span className="statutory-badge vault">
              <Lock size={11} /> SECTION 65B IMMUTABLE VAULT
            </span>
            <span className="statutory-badge admissible">
              <ShieldCheck size={11} /> COURTROOM ADMISSIBLE
            </span>
          </div>
          <div className="evidence-docket-line">
            DOCKET: <strong>TV-2026-041 // CR-RANSOM-09B</strong>
          </div>
          <h1 className="evidence-header-title">
            Chain of Custody & Statutory Evidence Locker
          </h1>
          <p className="evidence-header-subtitle">
            FIPS 180-4 cryptographic container adhering to BSA 2023 / Indian Evidence Act statutory provisions. Handoffs write directly to write-once hardware enclaves with RFC 3161 tamper-resistant time-stamping.
          </p>
        </div>

        <div className="evidence-header-actions">
          <button className="btn-deposit-exhibit" title="Deposit new artifact">
            <Plus size={13} />
            <span>Deposit Exhibit</span>
          </button>
          <button className="btn-court-bundle" title="Export complete court bundle">
            <FileDown size={13} />
            <span>Export Court Bundle (ZIP/PDF)</span>
          </button>
          <button className="btn-verify-merkle" title="Verify Merkle Root against ledger state">
            <CheckCircle2 size={13} />
            <span>Verify Merkle Root</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards matching screenshot */}
      <div className="evidence-metrics-grid">
        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>TOTAL SEALED EXHIBITS</span>
            <Lock size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">14 Exhibits</span>
            <div className="metric-sub green">100% Hash Matched & Certified</div>
          </div>
          <div className="metric-bar-indicator cyan" />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>CRYPTOGRAPHIC INTEGRITY</span>
            <Fingerprint size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">FIPS 180-4 SHA-256</span>
            <div className="metric-sub">Root: 0x7a8f...9b2c (Valid)</div>
          </div>
          <div className="metric-bar-indicator green" />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>CUSTODY CONTINUITY</span>
            <LinkIcon size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">Unbroken (7 Handoffs)</span>
            <div className="metric-sub green">● Zero Tampering Detected</div>
          </div>
          <div className="metric-bar-indicator green" />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>JUDICIAL SUBPOENA STATUS</span>
            <Gavel size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">4 Orders Executed</span>
            <div className="metric-sub">CrPC S.91 / 1 MLAT Pending</div>
          </div>
          <div className="metric-bar-indicator cyan" />
        </div>
      </div>

      {/* Filter Row matching screenshot */}
      <div className="evidence-filter-bar">
        <div className="filter-left-group">
          <div className="filter-search-box">
            <Search size={12} />
            <input
              type="text"
              placeholder="Filter Exhibit ID, SHA Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills-group">
            {['All', 'Blockchain Trails', 'PCAP Dumps', 'KYC Extracts', 'Device Images'].map((cat) => (
              <button
                key={cat}
                className={`filter-pill-btn ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'All' ? 'All (14)' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-status-text">
          <span>1 selected · Cryptographic Verification Engine: <strong>ACTIVE (Online HSM)</strong> | Density: Forensic Compact</span>
        </div>
      </div>

      {/* Split Workspace: Master Register Table + Inspection Focus Drawer */}
      <div className="evidence-split-workspace">
        {/* Left Master Register Table */}
        <div className="evidence-table-container">
          <table className="evidence-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}><input type="checkbox" defaultChecked /></th>
                <th style={{ width: '70px' }}>EXHIBIT #</th>
                <th>ARTIFACT / EVIDENCE NAME</th>
                <th style={{ width: '90px' }}>FORMAT / SIZE</th>
                <th style={{ width: '190px' }}>SHA-256 CRYPTOGRAPHIC CHECKSUM</th>
              </tr>
            </thead>
            <tbody>
              {filteredExhibits.map((item) => {
                const isSelected = selectedExhibit.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => setSelectedExhibit(item)}
                  >
                    <td><input type="checkbox" checked={isSelected} readOnly /></td>
                    <td>
                      <span className="exhibit-id-badge">{item.id}</span>
                    </td>
                    <td>
                      <div className="exhibit-name">{item.title}</div>
                      <div className="exhibit-meta">{item.meta}</div>
                    </td>
                    <td>
                      <span className="format-pill">{item.format}</span>
                      <span className="size-text">{item.size}</span>
                    </td>
                    <td>
                      <div className="hash-cell">
                        <span>{item.hash.slice(0, 14)}...{item.hash.slice(-4)}</span>
                        <Copy
                          size={11}
                          style={{ cursor: 'pointer', color: '#64748b' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.hash);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="table-footer-status">
            <span>Showing {filteredExhibits.length} of 14 sealed exhibits · Hardware WORM Lock Enforced</span>
            <div className="table-pagination-btns">
              <button className="table-page-btn">PREV</button>
              <button className="table-page-btn active">1</button>
              <button className="table-page-btn">2</button>
              <button className="table-page-btn">3</button>
              <button className="table-page-btn">NEXT</button>
            </div>
          </div>
        </div>

        {/* Right Inspection Focus Panel matching screenshot */}
        <div className="inspection-focus-panel">
          <div className="focus-top-header">
            <div>
              <span className="focus-eyebrow">INSPECTION FOCUS</span>
              <h3 className="focus-title">{selectedExhibit.id}: Hop 1.0 - 3.0 Corroborated Transaction Stream</h3>
              <p className="focus-subtitle">
                Format: {selectedExhibit.format} · Payload Size: {selectedExhibit.size} · Ingested via RPC Corroborator
              </p>
            </div>
            <span className="focus-badge">SEAL VALID</span>
          </div>

          {/* Cryptographic Fingerprint Box */}
          <div className="fingerprint-box">
            <div className="fingerprint-header">
              <span>FIPS CRYPTOGRAPHIC FINGERPRINT</span>
              <span className="time-locked-badge">RFC 3161 TIME-LOCKED</span>
            </div>
            <div className="sha-digest-full">
              SHA-256 Digest: {selectedExhibit.hash}
            </div>
            <div className="fingerprint-sub-row">
              <span>Merkle Leaf Index: <strong>{selectedExhibit.leafIndex}</strong></span>
              <span>Hardware Seal: <strong>{selectedExhibit.hardwareSeal}</strong></span>
            </div>
            <div className="fingerprint-sub-row">
              <span>Hardware RFC 3161 Timestamp: <strong>{selectedExhibit.timestamp}</strong></span>
            </div>
          </div>

          {/* Custody Chain Timeline */}
          <div className="custody-timeline-box">
            <div className="custody-header">
              <span>CUSTODY CHAIN TIMELINE</span>
              <span className="sealed-tag">5 STEPS SEALED</span>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>1. Acquisition & Memory Freeze</span>
                <span>08:21:12 UTC</span>
              </div>
              <div className="custody-step-desc">
                Automated RPC node snapshot captured by TRACEVAULT Core Engine v4.8. High-entropy mempool transactions frozen without host disruption.
              </div>
              <div className="custody-step-agent">
                AGENT: DAEMON_BLR_CORRIDOR_01
              </div>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>2. Cryptographic Hashing & HSM Sign</span>
                <span>08:23:44 UTC</span>
              </div>
              <div className="custody-step-desc">
                Dual hash calculated (SHA-256 + BLAKE3). Ingested into cryptographic HSM with Examiner Certificate token #8327A.
              </div>
              <div className="custody-step-agent">
                SIG: 0x93fe...ca01 (VALID)
              </div>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>3. Transfer to Evidence Locker</span>
                <span>08:39:04 UTC</span>
              </div>
              <div className="custody-step-desc">
                Sealed into hardware WORM enclave with Merkle verification leaf.
              </div>
              <div className="custody-step-agent">
                STATUS: TAMPER-PROOF ARCHIVE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Merkle Tree Footer Box */}
      <div className="merkle-footer-box">
        <div className="merkle-info">
          <span className="merkle-title">DYNAMIC MERKLE VERIFICATION TREE</span>
          <span className="merkle-hash-text">
            Root Hash: 0x7a8f114c009bb3de4860b24fa93bc821098e98341209ac4
          </span>
          <span className="merkle-sub-text">
            All 14 exhibits cryptographic leaves are verified continuously against state consensus every 300 seconds.
          </span>
        </div>
        <button className="button button-secondary" title="Audit all tree leaves">
          <GitBranch size={13} />
          <span>Audit Tree Leaves</span>
        </button>
      </div>
    </div>
  );
}
