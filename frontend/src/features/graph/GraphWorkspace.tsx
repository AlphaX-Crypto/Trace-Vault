import React, { useState, useMemo, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';

export interface GraphEntity {
  id: string;
  category: 'suspect' | 'intermediary' | 'unknown' | 'deposit' | 'vasp' | 'mixer';
  title: string;
  identifier: string;
  sublabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  risk: 'High' | 'Medium' | 'Low' | 'Attributed';
  attribution?: string;
  confidence?: string;
  txCount: number;
  volume: string;
  firstSeen: string;
  relationships: number;
}

const GRAPH_ENTITIES: GraphEntity[] = [
  {
    id: 'suspect',
    category: 'suspect',
    title: 'SUBJECT WALLET',
    identifier: '0x71F9A...F84C2',
    sublabel: 'High Risk Indicators',
    x: 50,
    y: 280,
    width: 175,
    height: 64,
    risk: 'High',
    txCount: 42,
    volume: '55.20 ETH',
    firstSeen: '2026-09-29 08:14 UTC',
    relationships: 3
  },
  {
    id: 'unknown-1',
    category: 'unknown',
    title: 'UNKNOWN WALLET',
    identifier: '0x6D11A...E813C',
    sublabel: 'Unattributed Address',
    x: 345,
    y: 155,
    width: 175,
    height: 64,
    risk: 'Low',
    txCount: 6,
    volume: '0.74 ETH',
    firstSeen: '2026-09-29 08:18 UTC',
    relationships: 2
  },
  {
    id: 'mixer-1',
    category: 'mixer',
    title: 'POSSIBLE MIXER INDICATOR',
    identifier: '0x891C7...0D55E',
    sublabel: 'Contract Interaction',
    x: 640,
    y: 155,
    width: 185,
    height: 64,
    risk: 'Medium',
    txCount: 140,
    volume: '30.00 ETH Pool',
    firstSeen: '2026-09-29 08:20 UTC',
    relationships: 4
  },
  {
    id: 'inter-a',
    category: 'intermediary',
    title: 'INTERMEDIARY A',
    identifier: '0x84C2E...F17BD',
    sublabel: 'Intermediary Address',
    x: 345,
    y: 280,
    width: 175,
    height: 64,
    risk: 'Medium',
    txCount: 19,
    volume: '42.50 ETH',
    firstSeen: '2026-09-29 08:22 UTC',
    relationships: 4
  },
  {
    id: 'inter-b',
    category: 'intermediary',
    title: 'INTERMEDIARY B',
    identifier: '0x3AF17...828C4',
    sublabel: 'Intermediary Address',
    x: 640,
    y: 280,
    width: 175,
    height: 64,
    risk: 'Medium',
    txCount: 12,
    volume: '30.00 ETH',
    firstSeen: '2026-09-29 08:30 UTC',
    relationships: 2
  },
  {
    id: 'deposit-1',
    category: 'deposit',
    title: 'EXCHANGE DEPOSIT',
    identifier: '0x92DE8...C11A7',
    sublabel: 'Exchange Deposit Gateway',
    x: 935,
    y: 280,
    width: 195,
    height: 64,
    risk: 'Attributed',
    attribution: 'Example Exchange Deposit Gateway',
    confidence: '78%',
    txCount: 88,
    volume: '30.00 ETH',
    firstSeen: '2026-09-29 08:35 UTC',
    relationships: 2
  },
  {
    id: 'vasp-1',
    category: 'vasp',
    title: 'POTENTIAL VASP ASSOCIATION',
    identifier: 'Example Exchange',
    sublabel: '82% Attribution Confidence',
    x: 1250,
    y: 280,
    width: 180,
    height: 64,
    risk: 'Attributed',
    attribution: 'Example Exchange Ltd (VASP)',
    confidence: '82%',
    txCount: 1240,
    volume: '₹1.24 Cr Payouts',
    firstSeen: '2026-09-29 09:10 UTC',
    relationships: 12
  },
  {
    id: 'inter-c',
    category: 'intermediary',
    title: 'INTERMEDIARY C',
    identifier: '0xD42A1...E0948',
    sublabel: 'Intermediary Address',
    x: 640,
    y: 405,
    width: 175,
    height: 64,
    risk: 'Low',
    txCount: 4,
    volume: '0.43 ETH',
    firstSeen: '2026-09-29 08:40 UTC',
    relationships: 2
  },
  {
    id: 'unknown-2',
    category: 'unknown',
    title: 'UNKNOWN WALLET',
    identifier: '0x19EFC...A044D',
    sublabel: 'Unattributed Address',
    x: 935,
    y: 405,
    width: 175,
    height: 64,
    risk: 'Low',
    txCount: 2,
    volume: '0.10 ETH',
    firstSeen: '2026-09-29 08:45 UTC',
    relationships: 1
  }
];

export interface GraphWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onOpenTransactions?: () => void;
  onOpenRisk?: () => void;
  onOpenEvidence?: () => void;
  initialSelectedId?: string;
  hideHeader?: boolean;
}

export const GraphWorkspace: React.FC<GraphWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onOpenTransactions,
  onOpenRisk,
  onOpenEvidence,
  initialSelectedId,
  hideHeader = false
}) => {
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [entities, setEntities] = useState<GraphEntity[]>(GRAPH_ENTITIES);
  const initialEntity = initialSelectedId
    ? GRAPH_ENTITIES.find((e) => e.id === initialSelectedId) || GRAPH_ENTITIES[0]
    : GRAPH_ENTITIES[0];

  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(initialEntity);
  const [hopDepth, setHopDepth] = useState<number>(3);
  const [direction, setDirection] = useState<'Outgoing' | 'Incoming' | 'All'>('Outgoing');
  const [isVaspHighlighted, setIsVaspHighlighted] = useState<boolean>(true);
  const [searchVal, setSearchVal] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [evidenceAdded, setEvidenceAdded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadGraphData() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const dirParam = direction === 'All' ? 'both' : direction.toLowerCase();
        const res = await api.post<any>(`/api/cases/${activeCaseId}/graph/analyze`, {
          max_hops: hopDepth,
          direction: dirParam
        });

        if (!isMounted) return;

        if (res.success && res.data) {
          setDataSource('LIVE_BACKEND');
          if (Array.isArray(res.data.nodes) && res.data.nodes.length > 0) {
            const liveNodeMap = new Map<string, any>();
            res.data.nodes.forEach((n: any) => {
              if (n.node_id) liveNodeMap.set(n.node_id.toLowerCase(), n);
            });

            const updated = GRAPH_ENTITIES.map((ent) => {
              const match =
                liveNodeMap.get(ent.identifier.toLowerCase()) ||
                (ent.category === 'suspect'
                  ? res.data.nodes.find((n: any) => n.entity_type === 'WALLET' || n.node_id === res.data.subject)
                  : null) ||
                (ent.category === 'vasp' ? res.data.nodes.find((n: any) => n.entity_type === 'VASP') : null);

              if (match) {
                return {
                  ...ent,
                  txCount: match.tx_count || ent.txCount,
                  volume: match.volume ? `${match.volume} ${match.rail || 'ETH'}` : ent.volume,
                  risk:
                    match.risk_level === 'HIGH'
                      ? 'High'
                      : match.risk_level === 'LOW'
                      ? 'Low'
                      : match.risk_level === 'ATTRIBUTED'
                      ? 'Attributed'
                      : ent.risk
                };
              }
              return ent;
            });
            setEntities(updated);
          }
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }

    loadGraphData();
    return () => {
      isMounted = false;
    };
  }, [hopDepth, direction]);

  // Search filtering
  const matchingEntityIds = useMemo(() => {
    if (!searchVal.trim()) return new Set<string>();
    const q = searchVal.toLowerCase();
    const set = new Set<string>();
    entities.forEach((e) => {
      if (
        e.title.toLowerCase().includes(q) ||
        e.identifier.toLowerCase().includes(q) ||
        e.sublabel.toLowerCase().includes(q) ||
        (e.attribution && e.attribution.toLowerCase().includes(q))
      ) {
        set.add(e.id);
      }
    });
    return set;
  }, [searchVal, entities]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddEvidence = () => {
    setEvidenceAdded(true);
    setTimeout(() => setEvidenceAdded(false), 2500);
  };

  const getRiskBadgeClass = (risk: GraphEntity['risk']) => {
    switch (risk) {
      case 'High':
        return 'risk-tag-high';
      case 'Medium':
        return 'risk-tag-medium';
      case 'Low':
        return 'risk-tag-low';
      case 'Attributed':
        return 'risk-tag-attributed';
      default:
        return 'risk-tag-neutral';
    }
  };

  return (
    <div className="graph-workspace-root font-sans">
      {/* 1. Standard Page Context Header */}
      {!hideHeader && (
        <header className="graph-context-header">
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
              <span className="breadcrumb-current">Trace Graph</span>
            </nav>
            <div className="header-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 className="page-main-title font-sans">Trace Graph</h1>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background:
                      dataSource === 'LIVE_BACKEND'
                        ? '#ECFDF5'
                        : dataSource === 'BACKEND_UNAVAILABLE'
                        ? '#FEF2F2'
                        : '#F1F5F9',
                    color:
                      dataSource === 'LIVE_BACKEND'
                        ? '#047857'
                        : dataSource === 'BACKEND_UNAVAILABLE'
                        ? '#B91C1C'
                        : '#475569',
                    border: `1px solid ${
                      dataSource === 'LIVE_BACKEND'
                        ? '#A7F3D0'
                        : dataSource === 'BACKEND_UNAVAILABLE'
                        ? '#FECACA'
                        : '#CBD5E1'
                    }`
                  }}
                >
                  {dataSource === 'LIVE_BACKEND'
                    ? '● LIVE BACKEND'
                    : dataSource === 'BACKEND_UNAVAILABLE'
                    ? '✕ BACKEND OFFLINE (FIXTURE)'
                    : '○ DEMO / SYNTHETIC'}
                </span>
              </div>
              <p className="page-main-sub font-sans">
                Explore transaction relationships and multi-hop movement associated with this investigation.
              </p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-actions-row">
              {onOpenTransactions && (
                <button
                  type="button"
                  onClick={onOpenTransactions}
                  className="btn-secondary-action font-sans"
                >
                  View in Transactions →
                </button>
              )}
              {onOpenRisk && (
                <button
                  type="button"
                  onClick={onOpenRisk}
                  className="btn-primary-action font-sans"
                >
                  Analyze Risk Profile →
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Workspace Body */}
      <main className="graph-main-content">
        {/* Graph Controls Bar */}
        <section className="graph-controls-bar font-sans">
          <div className="controls-left">
            <div className="search-input-wrap">
              <svg
                width="14"
                height="14"
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
                placeholder="Search entities, addresses, or tags..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="filter-search-input font-sans"
              />
            </div>

            <div className="control-group">
              <span className="control-label font-sans">Hop Depth:</span>
              <div className="segmented-control font-sans">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setHopDepth(d)}
                    className={`segment-btn font-sans ${hopDepth === d ? 'active' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label font-sans">Direction:</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="filter-select font-sans"
              >
                <option value="Outgoing">Outgoing Only</option>
                <option value="Incoming">Incoming Only</option>
                <option value="All">All Flows</option>
              </select>
            </div>
          </div>

          <div className="controls-right">
            <button
              type="button"
              onClick={() => setIsVaspHighlighted((prev) => !prev)}
              className={`btn-toggle-vasp font-sans ${isVaspHighlighted ? 'active' : ''}`}
            >
              {isVaspHighlighted ? '✓ VASP Path Highlighted' : 'Highlight VASP Path'}
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="btn-fit-view font-sans"
            >
              Fit View
            </button>
          </div>
        </section>

        {/* 3. Primary Graph Canvas & Inspector Layout */}
        <div className="graph-workspace-grid">
          {/* Main Graph Card */}
          <section className="clean-white-card graph-canvas-card">
            <div className="canvas-viewport">
              <svg
                className="graph-svg-canvas"
                viewBox="20 120 1440 370"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" />
                  </marker>
                  <marker id="arrow-muted" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                  <marker id="arrow-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#d97706" />
                  </marker>
                </defs>

                {/* Scaled/Zoomable Canvas Content */}
                <g transform={`scale(${zoomLevel})`} style={{ transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}>
                  {/* Connectors / Edges Layer */}
                  <g className="graph-connectors-layer">
                    <path
                      d="M 225 312 L 285 312 L 285 187 L 345 187"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.25"
                      markerEnd="url(#arrow-muted)"
                    />
                    <path
                      d="M 520 187 L 640 187"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.25"
                      markerEnd="url(#arrow-amber)"
                    />
                    <path
                      d="M 225 312 L 345 312"
                      fill="none"
                      stroke={isVaspHighlighted ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isVaspHighlighted ? '2' : '1.25'}
                      markerEnd={isVaspHighlighted ? 'url(#arrow-blue)' : 'url(#arrow-muted)'}
                    />
                    <path
                      d="M 520 312 L 640 312"
                      fill="none"
                      stroke={isVaspHighlighted ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isVaspHighlighted ? '2' : '1.25'}
                      markerEnd={isVaspHighlighted ? 'url(#arrow-blue)' : 'url(#arrow-muted)'}
                    />
                    <path
                      d="M 815 312 L 935 312"
                      fill="none"
                      stroke={isVaspHighlighted ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isVaspHighlighted ? '2' : '1.25'}
                      markerEnd={isVaspHighlighted ? 'url(#arrow-blue)' : 'url(#arrow-muted)'}
                    />
                    <path
                      d="M 1130 312 L 1250 312"
                      fill="none"
                      stroke={isVaspHighlighted ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isVaspHighlighted ? '2' : '1.25'}
                      strokeDasharray="4 4"
                      markerEnd={isVaspHighlighted ? 'url(#arrow-blue)' : 'url(#arrow-muted)'}
                    />
                    <path
                      d="M 520 312 L 580 312 L 580 437 L 640 437"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.25"
                      markerEnd="url(#arrow-muted)"
                    />
                    <path
                      d="M 815 437 L 935 437"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.25"
                      markerEnd="url(#arrow-muted)"
                    />
                  </g>

                  {/* Edge Badges Layer */}
                  <g className="graph-edge-badges-layer font-sans">
                    <rect x="247" y="238" width="76" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="285" y="252" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.74 ETH</text>

                    <rect x="542" y="176" width="76" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="580" y="190" fill="#d97706" fontSize="10" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.15 ETH</text>

                    <rect x="247" y="301" width="76" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="285" y="315" fill="#2563eb" fontSize="10.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.45 ETH</text>

                    <rect x="542" y="301" width="76" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="580" y="315" fill="#2563eb" fontSize="10.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.30 ETH</text>

                    <rect x="837" y="301" width="76" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="875" y="315" fill="#2563eb" fontSize="10.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.30 ETH</text>

                    <rect x="1152" y="301" width="76" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="1190" y="315" fill="#2563eb" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">Associated</text>

                    <rect x="542" y="363" width="76" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="580" y="377" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.43 ETH</text>

                    <rect x="837" y="426" width="76" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="875" y="440" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="600" textAnchor="middle">0.10 ETH</text>
                  </g>

                  {/* Nodes Layer */}
                  <g className="graph-nodes-layer font-sans">
                    {entities.map((entity) => {
                      const isSelected = selectedEntity?.id === entity.id;
                      const isSubject = entity.category === 'suspect';
                      const isMixer = entity.category === 'mixer';
                      const isVasp = entity.category === 'vasp';
                      const isDeposit = entity.category === 'deposit';
                      const isSearched = matchingEntityIds.has(entity.id);

                      let strokeColor = '#e2e8f0';
                      let titleColor = '#64748b';
                      let bgColor = '#ffffff';

                      if (isSubject) {
                        strokeColor = '#fecaca';
                        titleColor = '#dc2626';
                        bgColor = '#fef2f2';
                      } else if (isMixer) {
                        strokeColor = '#fde68a';
                        titleColor = '#d97706';
                        bgColor = '#fffbeb';
                      } else if (isVasp || isDeposit) {
                        strokeColor = '#bfdbfe';
                        titleColor = '#2563eb';
                        bgColor = '#eff6ff';
                      }

                      if (isSelected) {
                        strokeColor = '#2563eb';
                      } else if (isSearched) {
                        strokeColor = '#3b82f6';
                      }

                      return (
                        <g
                          key={entity.id}
                          transform={`translate(${entity.x}, ${entity.y})`}
                          onClick={() => setSelectedEntity(entity)}
                          style={{ cursor: 'pointer' }}
                        >
                          <rect
                            x="0"
                            y="0"
                            width={entity.width + 10}
                            height={68}
                            rx="8"
                            fill={bgColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? '2' : isSearched ? '2' : '1'}
                          />
                          <text
                            x="12"
                            y="20"
                            fill={titleColor}
                            fontSize="10"
                            fontWeight="600"
                            fontFamily="Inter, sans-serif"
                            letterSpacing="0.04em"
                          >
                            {entity.title}
                          </text>
                          <text
                            x="12"
                            y="40"
                            fill="#111827"
                            fontSize="12.5"
                            fontWeight="600"
                            fontFamily={isVasp ? 'Inter, sans-serif' : 'monospace'}
                          >
                            {entity.identifier}
                          </text>
                          <text
                            x="12"
                            y="56"
                            fill="#64748b"
                            fontSize="10.5"
                            fontFamily="Inter, sans-serif"
                          >
                            {entity.sublabel}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>
              </svg>

              {/* Bottom Left Legend */}
              <div className="canvas-legend font-sans">
                <span className="legend-item">
                  <span className="legend-dot bg-red" /> Subject Wallet
                </span>
                <span className="legend-item">
                  <span className="legend-dot bg-slate" /> Intermediary
                </span>
                <span className="legend-item">
                  <span className="legend-dot bg-gray" /> Unknown Wallet
                </span>
                <span className="legend-item">
                  <span className="legend-dot bg-blue" /> Potential VASP
                </span>
                <span className="legend-item">
                  <span className="legend-dot bg-amber" /> Mixer Indicator
                </span>
              </div>

              {/* Bottom Right Zoom Controls */}
              <div className="canvas-zoom-controls font-sans">
                <button
                  type="button"
                  className="btn-zoom"
                  title="Zoom In"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.5))}
                >
                  +
                </button>
                <div className="zoom-divider" />
                <button
                  type="button"
                  className="btn-zoom"
                  title="Zoom Out"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))}
                >
                  −
                </button>
                <div className="zoom-divider" />
                <button
                  type="button"
                  className="btn-zoom text-reset"
                  onClick={() => setZoomLevel(1)}
                >
                  100%
                </button>
              </div>
            </div>
          </section>

          {/* Right Node Inspector */}
          <aside className="clean-white-card graph-inspector-card font-sans" aria-label="Node Inspector">
            {selectedEntity ? (
              <div className="inspector-content">
                {/* Header */}
                <div className="inspector-header">
                  <div className="inspector-top-row">
                    <span className="inspector-id font-mono">
                      {selectedEntity.id === 'suspect' ? 'SUBJECT' : selectedEntity.id.toUpperCase()}
                    </span>
                    <span className={`risk-tag font-sans ${getRiskBadgeClass(selectedEntity.risk)}`}>
                      {selectedEntity.risk} Indicator
                    </span>
                  </div>
                  <div className="inspector-id-box">
                    <span className="inspector-title font-mono">{selectedEntity.identifier}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedEntity.identifier, 'id')}
                      className="btn-copy-chip font-sans"
                      title="Copy Identifier"
                    >
                      {copiedField === 'id' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="inspector-desc font-sans">
                    {selectedEntity.title} • {selectedEntity.sublabel}
                  </p>
                </div>

                {/* Section 1: Entity Details */}
                <div className="inspector-section">
                  <div className="section-subtitle font-sans">Entity Details</div>
                  <div className="meta-list font-sans">
                    <div className="meta-row">
                      <span className="meta-label">Node Identifier</span>
                      <span className="meta-val font-mono">{selectedEntity.identifier}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Classification</span>
                      <span className="meta-val font-sans">{selectedEntity.title}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Risk Profile</span>
                      <span className={`risk-tag font-sans ${getRiskBadgeClass(selectedEntity.risk)}`}>
                        {selectedEntity.risk}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Observed Date</span>
                      <span className="meta-val font-mono">{selectedEntity.firstSeen}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Transaction Activity */}
                <div className="inspector-section">
                  <div className="section-subtitle font-sans">Transaction Activity</div>
                  <div className="meta-list font-sans">
                    <div className="meta-row">
                      <span className="meta-label">Traced Volume</span>
                      <span className="meta-val font-mono font-medium">{selectedEntity.volume}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Recorded Movements</span>
                      <span className="meta-val font-mono">{selectedEntity.txCount} Records</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Graph Degrees</span>
                      <span className="meta-val font-mono">{selectedEntity.relationships} Hops</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: VASP Attribution (if applicable) */}
                {selectedEntity.attribution && (
                  <div className="inspector-section">
                    <div className="section-subtitle font-sans">Attribution Intelligence</div>
                    <div className="attribution-panel font-sans">
                      <div className="attr-name font-sans">{selectedEntity.attribution}</div>
                      <div className="attr-conf font-mono">Confidence Score: {selectedEntity.confidence}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="inspector-actions">
                  <button
                    type="button"
                    className="btn-cross-nav font-sans"
                    onClick={() => alert(`Tracing recursive hop flow from ${selectedEntity.identifier}...`)}
                  >
                    Trace Path From Here →
                  </button>

                  {onOpenTransactions && (
                    <button
                      type="button"
                      className="btn-cross-nav font-sans"
                      onClick={onOpenTransactions}
                    >
                      View in Transactions →
                    </button>
                  )}

                  {onOpenRisk && (
                    <button
                      type="button"
                      className="btn-cross-nav font-sans"
                      onClick={onOpenRisk}
                    >
                      Analyze Risk Profile →
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-secondary-action font-sans full-width"
                    onClick={handleAddEvidence}
                  >
                    {evidenceAdded ? '✓ Added to Case Evidence' : '+ Add to Case Evidence'}
                  </button>

                  {onOpenEvidence && (
                    <button
                      type="button"
                      className="btn-cross-nav font-sans"
                      onClick={onOpenEvidence}
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="empty-title font-sans">Select a graph entity</h3>
                <p className="empty-desc font-sans">
                  Choose a wallet, intermediary, or associated entity on the canvas to inspect its intelligence profile.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      <style>{`
        .graph-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
        }

        .graph-context-header {
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

        .graph-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Controls Bar */
        .graph-controls-bar {
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

        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 12px;
          width: 260px;
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

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .segmented-control {
          display: flex;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .segment-btn {
          background: #ffffff;
          border: none;
          padding: 5px 11px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .segment-btn:hover {
          background: #f8fafc;
        }

        .segment-btn.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
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

        .btn-toggle-vasp {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-vasp.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
          font-weight: 600;
        }

        .btn-fit-view {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-fit-view:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Two-Column Grid */
        .graph-workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 20px;
          align-items: stretch;
        }

        .clean-white-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .graph-canvas-card {
          position: relative;
          min-height: 530px;
          height: calc(100vh - 270px);
          max-height: 640px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .canvas-viewport {
          position: relative;
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #ffffff;
        }

        .graph-svg-canvas {
          width: 100%;
          height: 100%;
        }

        /* Legend */
        .canvas-legend {
          position: absolute;
          bottom: 16px;
          left: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 12px;
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 11.5px;
          color: #64748b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .bg-red { background: #ef4444; }
        .bg-slate { background: #64748b; }
        .bg-gray { background: #94a3b8; }
        .bg-blue { background: #2563eb; }
        .bg-amber { background: #f59e0b; }

        /* Zoom controls */
        .canvas-zoom-controls {
          position: absolute;
          bottom: 16px;
          right: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .btn-zoom {
          background: transparent;
          border: none;
          padding: 6px 10px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
        }

        .btn-zoom:hover {
          background: #f8fafc;
        }

        .btn-zoom.text-reset {
          font-size: 11px;
          font-weight: 500;
        }

        .zoom-divider {
          width: 1px;
          height: 14px;
          background: #e2e8f0;
        }

        /* Inspector */
        .graph-inspector-card {
          padding: 22px;
          min-height: 530px;
          height: calc(100vh - 270px);
          max-height: 640px;
          overflow-y: auto;
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
          margin-bottom: 10px;
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

        .inspector-id-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 8px;
        }

        .inspector-title {
          font-size: 12.5px;
          font-weight: 600;
          color: #0f172a;
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
          flex-shrink: 0;
        }

        .meta-val {
          color: #111827;
          text-align: right;
          word-break: break-word;
        }

        .risk-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .risk-tag-high {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .risk-tag-medium {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fef3c7;
        }

        .risk-tag-low {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .risk-tag-attributed {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .risk-tag-neutral {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .attribution-panel {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .attr-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .attr-conf {
          font-size: 11px;
          color: #2563eb;
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
          .graph-workspace-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
