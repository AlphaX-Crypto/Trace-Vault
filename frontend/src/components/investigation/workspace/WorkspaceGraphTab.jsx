import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Filter,
  Layers,
  ZoomIn,
  Eye,
  Info,
  X,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  GitBranch
} from 'lucide-react';

/**
 * Derives visual ReactFlow nodes and edges from UnifiedInvestigationResult.
 */
function buildFlowData(result) {
  if (!result) return { initialNodes: [], initialEdges: [] };

  const nodesMap = new Map();
  const edgesList = [];

  const subject = result.subject || {};
  const paths = result.graph_paths || [];
  const crossAssocs = result.cross_rail_associations || [];
  const vaspAttrs = result.attribution_candidates || [];
  const timeline = result.timeline || [];

  // Helper to ensure node exists
  function getOrAddNode(id, rail, label, type, risk = 0, tags = []) {
    if (!id) return;
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        id,
        rail,
        label: label || id,
        type: type || (rail === 'CRYPTO' ? 'wallet' : 'upi_vpa'),
        riskScore: risk,
        tags: [...tags]
      });
    } else {
      const existing = nodesMap.get(id);
      existing.riskScore = Math.max(existing.riskScore, risk);
      existing.tags = Array.from(new Set([...existing.tags, ...tags]));
    }
  }

  // 1. Add Subject Node
  const subjectId = subject.id || 'SUBJECT';
  const subjectRail = (subject.type === 'wallet' ? 'CRYPTO' : subject.type === 'upi_vpa' ? 'UPI' : 'MULTI_RAIL');
  getOrAddNode(
    subjectId,
    subjectRail,
    subjectId.length > 20 ? `${subjectId.slice(0, 8)}...${subjectId.slice(-6)}` : subjectId,
    subject.type,
    result.risk_summary?.overall_score || 50,
    ['subject', 'focus']
  );

  // 2. Add Nodes & Edges from Timeline
  timeline.forEach((evt, idx) => {
    const src = evt.actor_reference;
    const tgt = evt.target_reference;
    const rail = evt.rail || 'CRYPTO';

    if (src) {
      getOrAddNode(src, rail, src.length > 20 ? `${src.slice(0, 8)}...${src.slice(-6)}` : src, rail === 'CRYPTO' ? 'wallet' : 'upi_vpa', 40);
    }
    if (tgt) {
      const isVasp = vaspAttrs.some((v) => v.vasp_name === tgt || v.wallet_address === tgt);
      getOrAddNode(tgt, rail, tgt.length > 20 ? `${tgt.slice(0, 8)}...${tgt.slice(-6)}` : tgt, isVasp ? 'vasp' : (rail === 'CRYPTO' ? 'wallet' : 'upi_vpa'), isVasp ? 70 : 30);
    }

    if (src && tgt && src !== tgt) {
      edgesList.push({
        id: `e-tl-${idx}-${src}-${tgt}`,
        source: src,
        target: tgt,
        rail,
        amount: evt.amount,
        currency: evt.currency,
        label: evt.amount ? `${evt.amount} ${evt.currency || ''}` : evt.event_type,
        isCrossRail: false
      });
    }
  });

  // 3. Add Nodes & Edges from Cross-Rail Associations
  crossAssocs.forEach((ca, idx) => {
    const src = ca.source_node_id?.replace(/^(wallet:|upi:|vasp:)/, '') || ca.source_node_id;
    const tgt = ca.target_node_id?.replace(/^(wallet:|upi:|vasp:)/, '') || ca.target_node_id;

    if (src) getOrAddNode(src, ca.source_rail || 'CRYPTO', src.length > 20 ? `${src.slice(0, 8)}...${src.slice(-6)}` : src, 'wallet', 60, ['cross_rail_source']);
    if (tgt) getOrAddNode(tgt, ca.target_rail || 'UPI', tgt, 'upi_vpa', 60, ['cross_rail_target']);

    if (src && tgt) {
      edgesList.push({
        id: `e-cr-${idx}`,
        source: src,
        target: tgt,
        rail: 'MULTI_RAIL',
        label: `BRIDGE (${ca.confidence || 85}%)`,
        isCrossRail: true,
        description: ca.description
      });
    }
  });

  // 4. Add VASP attributions
  vaspAttrs.forEach((va) => {
    const w = va.wallet_address;
    if (w) {
      getOrAddNode(w, 'CRYPTO', va.vasp_name || w, 'vasp', va.risk_score || 60, ['vasp_deposit']);
    }
  });

  // Position nodes horizontally or in structured tiers
  const nodeArray = Array.from(nodesMap.values());
  const initialNodes = nodeArray.map((n, i) => {
    // Determine visual style based on rail
    let borderColor = 'var(--color-border)';
    let bgColor = 'var(--color-surface)';
    let textColor = 'var(--color-primary-text)';

    if (n.tags.includes('subject')) {
      borderColor = 'var(--color-accent)';
      bgColor = 'rgba(36, 199, 201, 0.15)';
    } else if (n.type === 'vasp') {
      borderColor = '#f59e0b';
      bgColor = 'rgba(245, 158, 11, 0.12)';
    } else if (n.rail === 'UPI') {
      borderColor = '#a855f7';
      bgColor = 'rgba(168, 85, 247, 0.12)';
    } else {
      borderColor = '#24c7c9';
      bgColor = 'rgba(36, 199, 201, 0.08)';
    }

    // Grid coordinate layout
    const col = i % 4;
    const row = Math.floor(i / 4);

    return {
      id: n.id,
      position: { x: 50 + col * 280, y: 50 + row * 150 },
      data: {
        label: (
          <div style={{ padding: '6px 8px', textAlign: 'left', minWidth: '150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className={`rail-pill ${(n.rail || 'crypto').toLowerCase().replace('_', '-')}`} style={{ fontSize: '9px' }}>
                {n.rail}
              </span>
              <span style={{ fontSize: '10px', color: n.riskScore >= 70 ? 'var(--color-critical)' : 'var(--color-secondary-text)', fontWeight: 600 }}>
                Risk {n.riskScore}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '11px', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {n.label}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--color-muted-text)', textTransform: 'uppercase', marginTop: '2px' }}>
              {n.type}
            </div>
          </div>
        ),
        raw: n
      },
      style: {
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '6px',
        color: textColor,
        width: 190,
        boxShadow: n.tags.includes('subject') ? '0 0 10px rgba(36, 199, 201, 0.4)' : 'none',
        cursor: 'pointer'
      }
    };
  });

  // Deduplicate edges
  const seenEdges = new Set();
  const initialEdges = edgesList.filter((e) => {
    const k = `${e.source}->${e.target}`;
    if (seenEdges.has(k)) return false;
    seenEdges.add(k);
    return true;
  }).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: e.isCrossRail,
    label: e.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: {
      stroke: e.isCrossRail ? '#ec4899' : (e.rail === 'UPI' ? '#a855f7' : '#24c7c9'),
      strokeWidth: e.isCrossRail ? 2.5 : 1.5,
      strokeDasharray: e.isCrossRail ? '5,5' : 'none'
    },
    labelStyle: { fill: 'var(--color-secondary-text)', fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: 'var(--color-surface)', fillOpacity: 0.9, rx: 3, ry: 3 },
    data: e
  }));

  return { initialNodes, initialEdges };
}

export default function WorkspaceGraphTab({ result }) {
  const [railFilter, setRailFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);

  const { initialNodes, initialEdges } = useMemo(() => buildFlowData(result), [result]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((n) => {
      const raw = n.data.raw;
      if (railFilter !== 'ALL' && raw.rail !== railFilter) return false;
      if (riskFilter === 'HIGH' && (raw.riskScore || 0) < 50) return false;
      return true;
    });
  }, [initialNodes, railFilter, riskFilter]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return initialEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [initialEdges, visibleNodeIds]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedItem({ type: 'node', data: node.data.raw });
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedItem({ type: 'edge', data: edge.data });
  }, []);

  return (
    <div className="workspace-tab-panel">
      {/* Graph Toolbar */}
      <div className="workspace-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Rail Filter:
            </span>
            {['ALL', 'CRYPTO', 'UPI', 'MULTI_RAIL'].map((r) => (
              <button
                key={r}
                className={`workspace-btn ${railFilter === r ? 'primary' : ''}`}
                onClick={() => setRailFilter(r)}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {r}
              </button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
              Risk Threshold:
            </span>
            <button
              className={`workspace-btn ${riskFilter === 'ALL' ? 'primary' : ''}`}
              onClick={() => setRiskFilter('ALL')}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              All Entities
            </button>
            <button
              className={`workspace-btn ${riskFilter === 'HIGH' ? 'primary' : ''}`}
              onClick={() => setRiskFilter('HIGH')}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Elevated Risk (≥50)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--color-muted-text)' }}>
            <span><strong>{filteredNodes.length}</strong> Nodes</span>
            <span><strong>{filteredEdges.length}</strong> Edges</span>
            {result?.graph_summary?.cross_rail_association_count > 0 && (
              <span style={{ color: '#ec4899', fontWeight: 600 }}>Cross-Rail Linked</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
        <div 
          className="workspace-card" 
          style={{ flex: 1, height: '580px', padding: 0, overflow: 'hidden', position: 'relative' }}
        >
          {filteredNodes.length > 0 ? (
            <ReactFlow
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              fitView
            >
              <Background color="#1a2a36" gap={16} />
              <Controls />
            </ReactFlow>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)' }}>
              No graph entities match the active filters.
            </div>
          )}
        </div>

        {/* Selected Entity / Edge Inspector Panel */}
        {selectedItem && (
          <div 
            className="workspace-card" 
            style={{ width: '320px', height: '580px', overflowY: 'auto' }}
          >
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <Info size={15} />
                <span>{selectedItem.type === 'node' ? 'Entity Inspector' : 'Edge Inspector'}</span>
              </div>
              <button 
                className="workspace-btn" 
                onClick={() => setSelectedItem(null)}
                style={{ padding: '2px 6px' }}
              >
                <X size={13} />
              </button>
            </div>

            {selectedItem.type === 'node' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span className="ribbon-label">Entity Identifier</span>
                  <div className="mono-hash" style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                    {selectedItem.data.id}
                  </div>
                </div>

                <div className="workspace-grid-2" style={{ gap: '8px' }}>
                  <div>
                    <span className="ribbon-label">Rail</span>
                    <div>
                      <span className={`rail-pill ${(selectedItem.data.rail || 'crypto').toLowerCase().replace('_', '-')}`}>
                        {selectedItem.data.rail}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="ribbon-label">Type</span>
                    <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{selectedItem.data.type}</div>
                  </div>
                </div>

                <div>
                  <span className="ribbon-label">Calculated Risk Score</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: selectedItem.data.riskScore >= 70 ? 'var(--color-critical)' : 'var(--color-accent)' }}>
                    {selectedItem.data.riskScore} / 100
                  </div>
                </div>

                <div>
                  <span className="ribbon-label">Attributed Tags</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {selectedItem.data.tags?.map((t) => (
                      <span key={t} style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '3px', fontSize: '10px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span className="ribbon-label">Edge Classification</span>
                  <div style={{ fontWeight: 600, marginTop: '4px' }}>
                    {selectedItem.data.isCrossRail ? 'CROSS-RAIL OFF-RAMP BRIDGE' : 'TRANSACTION TRANSFER'}
                  </div>
                </div>

                <div>
                  <span className="ribbon-label">Source Node</span>
                  <div className="mono-hash" style={{ wordBreak: 'break-all' }}>{selectedItem.data.source}</div>
                </div>

                <div>
                  <span className="ribbon-label">Target Node</span>
                  <div className="mono-hash" style={{ wordBreak: 'break-all' }}>{selectedItem.data.target}</div>
                </div>

                {selectedItem.data.amount && (
                  <div>
                    <span className="ribbon-label">Transfer Volume</span>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>
                      {selectedItem.data.amount} {selectedItem.data.currency}
                    </div>
                  </div>
                )}

                {selectedItem.data.description && (
                  <div>
                    <span className="ribbon-label">Bridge Evidence Description</span>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary-text)', lineHeight: '1.4' }}>
                      {selectedItem.data.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
