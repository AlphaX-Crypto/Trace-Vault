import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceGraphTab({ result }) {
  if (!result) return null;

  const subject = result.subject || {};
  const paths = result.graph_paths || [];
  const crossAssocs = result.cross_rail_associations || [];
  const vaspAttrs = result.attribution_candidates || [];

  // Controls state as per Section 11
  const [hopDepth, setHopDepth] = useState(3);
  const [direction, setDirection] = useState('BOTH'); // INCOMING, OUTGOING, BOTH
  const [railFilter, setRailFilter] = useState('ALL'); // ALL, CRYPTO, UPI, CROSS
  const [highlightVasp, setHighlightVasp] = useState(true);

  // Inspector state
  const [selectedNode, setSelectedNode] = useState({
    id: '0x88fa...10b2',
    fullAddress: '0x88fa3910b2c8491029384756102938475610b210',
    type: 'Exchange Deposit',
    vaspEntity: 'Binance (Probable)',
    confidence: '82% Confidence',
    riskFlags: ['Mixer Inflow Match', 'High Velocity Redistribution'],
    inflow: '42.00 ETH / BTC equivalent',
    outflow: '42.00 ETH'
  });
  const [copied, setCopied] = useState(false);

  // Generate nodes matching Transactiongraph.png
  const { nodes, edges } = useMemo(() => {
    const rawNodes = [
      {
        id: 'suspect',
        type: 'default',
        position: { x: 50, y: 160 },
        data: {
          label: (
            <div className="tv-graph-node suspect-node">
              <div className="tv-node-tag">SUSPECT WALLET</div>
              <div className="tv-node-address mono font-semibold">
                {subject.id ? `${subject.id.slice(0, 6)}...${subject.id.slice(-4)}` : '1A1zP1...f3a9'}
              </div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--text-primary)',
          borderRadius: '4px',
          padding: '10px 14px',
          width: 170,
          boxShadow: 'none'
        }
      },
      {
        id: 'intermediary1',
        type: 'default',
        position: { x: 280, y: 70 },
        data: {
          label: (
            <div className="tv-graph-node">
              <div className="tv-node-tag text-muted">INTERMEDIARY 1</div>
              <div className="tv-node-address mono">3J98t1...v4m1</div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '4px',
          padding: '10px 14px',
          width: 160,
          boxShadow: 'none'
        }
      },
      {
        id: 'intermediary2',
        type: 'default',
        position: { x: 280, y: 240 },
        data: {
          label: (
            <div className="tv-graph-node">
              <div className="tv-node-tag text-muted">INTERMEDIARY 2</div>
              <div className="tv-node-address mono">0x3a1b...f82c</div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '4px',
          padding: '10px 14px',
          width: 160,
          boxShadow: 'none'
        }
      },
      {
        id: 'deposit',
        type: 'default',
        position: { x: 520, y: 110 },
        data: {
          label: (
            <div className="tv-graph-node deposit-node">
              <div className="tv-node-tag" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>EXCHANGE DEPOSIT</div>
              <div className="tv-node-address mono">0x88fa...10b2</div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--accent-primary)',
          borderRadius: '4px',
          padding: '10px 14px',
          width: 170,
          boxShadow: 'none'
        }
      },
      {
        id: 'vasp',
        type: 'default',
        position: { x: 520, y: 210 },
        data: {
          label: (
            <div className="tv-graph-node vasp-node">
              <div className="tv-node-tag" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>BINANCE HOT WALLET</div>
              <div className="tv-node-subtitle text-muted" style={{ fontSize: '10px' }}>Likely Binance — 82% confidence</div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--accent-primary)',
          borderRadius: '4px',
          padding: '10px 14px',
          width: 180,
          boxShadow: 'none'
        }
      }
    ];

    const rawEdges = [
      {
        id: 'e-suspect-inter1',
        source: 'suspect',
        target: 'intermediary1',
        label: '45.2 BTC',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: 'var(--border-strong)', strokeWidth: 1.5 },
        labelStyle: { fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: 'var(--bg-surface)', rx: 2, ry: 2 }
      },
      {
        id: 'e-inter1-deposit',
        source: 'intermediary1',
        target: 'deposit',
        label: '42.0 BTC',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: highlightVasp ? 'var(--accent-primary)' : 'var(--border-strong)', strokeWidth: highlightVasp ? 2 : 1.5 },
        labelStyle: { fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: 'var(--bg-surface)', rx: 2, ry: 2 }
      },
      {
        id: 'e-inter2-vasp',
        source: 'intermediary2',
        target: 'vasp',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: 'var(--border-strong)', strokeWidth: 1.5 }
      }
    ];

    return { nodes: rawNodes, edges: rawEdges };
  }, [subject, highlightVasp]);

  const onNodeClick = useCallback((event, node) => {
    if (node.id === 'deposit') {
      setSelectedNode({
        id: '0x88fa...10b2',
        fullAddress: '0x88fa3910b2c8491029384756102938475610b210',
        type: 'Exchange Deposit',
        vaspEntity: 'Binance (Probable)',
        confidence: '82% Confidence',
        riskFlags: ['Mixer Inflow Match', 'High Velocity Redistribution'],
        inflow: '42.00 ETH / BTC equivalent',
        outflow: '42.00 ETH'
      });
    } else if (node.id === 'vasp') {
      setSelectedNode({
        id: '0x28c6...1d60',
        fullAddress: '0x28c6c06298d514db089934071355e5743bf21d60',
        type: 'VASP Hot Wallet Cluster',
        vaspEntity: 'Binance Custody Hub',
        confidence: '94% Confidence',
        riskFlags: ['High Velocity Redistribution'],
        inflow: '84.70 ETH',
        outflow: 'Multi-Account Sweep'
      });
    } else if (node.id === 'suspect') {
      setSelectedNode({
        id: subject.id ? `${subject.id.slice(0, 8)}...` : '1A1zP1...f3a9',
        fullAddress: subject.id || '1A1zP1eP5QGefi2DMPTFtL5SLmv7DivfNa',
        type: 'Suspect Primary Seed',
        vaspEntity: 'Unhosted Actor',
        confidence: 'Seed Target',
        riskFlags: ['Rapid Layering Dispersion', 'Mixer Interaction'],
        inflow: '84.70 BTC',
        outflow: '45.20 BTC'
      });
    } else {
      setSelectedNode({
        id: '3J98t1...v4m1',
        fullAddress: '3J98t1Wp5QGefi2DMPTFtL5SLmv7Divfv4m1',
        type: 'Transit Intermediary',
        vaspEntity: 'Unregistered Sybil',
        confidence: 'Transitory Hop',
        riskFlags: ['Peel Chain Redistribution'],
        inflow: '45.20 BTC',
        outflow: '42.00 BTC'
      });
    }
  }, [subject]);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="tv-graph-workspace anim-workspace">
      {/* LEFT: TRACE CONTROLS as required by Section 11 */}
      <div className="tv-graph-controls-panel">
        <div className="tv-card-header">
          <span className="tv-card-title">Trace Controls</span>
        </div>

        {/* Hop Depth */}
        <div className="tv-control-group">
          <label className="tv-control-label">HOP DEPTH</label>
          <div className="tv-hop-buttons-row">
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                className={`tv-hop-btn ${hopDepth === d ? 'active' : ''}`}
                onClick={() => setHopDepth(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Direction */}
        <div className="tv-control-group">
          <label className="tv-control-label">DIRECTION</label>
          <div className="tv-select-btn-group">
            {['BOTH', 'INCOMING', 'OUTGOING'].map((dir) => (
              <button
                key={dir}
                className={`tv-dir-btn ${direction === dir ? 'active' : ''}`}
                onClick={() => setDirection(dir)}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        {/* Rail Filters */}
        <div className="tv-control-group">
          <label className="tv-control-label">RAIL FILTERS</label>
          <div className="tv-rail-filters-list">
            <label className="tv-checkbox-row">
              <input
                type="radio"
                name="railFilter"
                checked={railFilter === 'ALL'}
                onChange={() => setRailFilter('ALL')}
              />
              <span>All Active Rails</span>
            </label>
            <label className="tv-checkbox-row">
              <input
                type="radio"
                name="railFilter"
                checked={railFilter === 'CRYPTO'}
                onChange={() => setRailFilter('CRYPTO')}
              />
              <span>Crypto Only</span>
            </label>
            <label className="tv-checkbox-row">
              <input
                type="radio"
                name="railFilter"
                checked={railFilter === 'UPI'}
                onChange={() => setRailFilter('UPI')}
              />
              <span>UPI Only</span>
            </label>
            <label className="tv-checkbox-row">
              <input
                type="radio"
                name="railFilter"
                checked={railFilter === 'CROSS'}
                onChange={() => setRailFilter('CROSS')}
              />
              <span>Cross-Rail Bridge</span>
            </label>
          </div>
        </div>

        {/* VASP Highlight Action */}
        <div className="tv-control-group" style={{ marginTop: '16px' }}>
          <button
            className={`tv-btn-highlight-vasp ${highlightVasp ? 'active' : ''}`}
            onClick={() => setHighlightVasp(!highlightVasp)}
          >
            {highlightVasp ? 'Hide VASP Path' : 'Highlight VASP Path'}
          </button>
        </div>
      </div>

      {/* CENTER: Interactive Transaction Graph Canvas */}
      <div className="tv-graph-canvas-container">
        {/* Top Graph Canvas Sub-Header */}
        <div className="tv-graph-canvas-toolbar">
          <div className="tv-toolbar-left">
            <button 
              className={`tv-btn-toolbar ${highlightVasp ? 'active' : ''}`}
              onClick={() => setHighlightVasp(!highlightVasp)}
            >
              Highlight VASP Path
            </button>
            <span className="tv-toolbar-info mono">Hops Depth: {hopDepth} Hops</span>
            <select className="tv-select-mode">
              <option value="force">Force Directed</option>
              <option value="hierarchical">Hierarchical BFS</option>
            </select>
          </div>

          <div className="tv-toolbar-right">
            <span className="mono text-muted" style={{ fontSize: '11px' }}>
              Nodes: {nodes.length} · Edges: {edges.length}
            </span>
          </div>
        </div>

        <div className="tv-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--border-subtle)" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* RIGHT: Node Inspector matching Transactiongraph.png */}
      <div className="tv-graph-inspector-panel anim-panel-slide">
        <div className="tv-inspector-header">
          <span className="tv-inspector-title">Node Inspector</span>
        </div>

        {selectedNode ? (
          <div className="tv-node-inspector-content">
            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Selected Node</span>
              <div className="tv-inspector-val-row">
                <span className="mono font-semibold">{selectedNode.id}</span>
                <button 
                  onClick={() => handleCopy(selectedNode.fullAddress)}
                  className="tv-icon-copy-btn"
                  title="Copy full node identifier"
                >
                  {copied ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Type</span>
              <span className="tv-inspector-text font-medium">{selectedNode.type}</span>
            </div>

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">VASP Entity</span>
              <span className="tv-inspector-text font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {selectedNode.vaspEntity}
              </span>
            </div>

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Confidence Score</span>
              <span className="mono font-semibold" style={{ color: 'var(--risk-low)' }}>
                {selectedNode.confidence}
              </span>
            </div>

            <div className="tv-dist-divider" style={{ margin: '14px 0' }} />

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Risk Flags Detected</span>
              <div className="tv-inspector-flags-list">
                {selectedNode.riskFlags.map((flag) => (
                  <div key={flag} className="tv-risk-flag-pill">
                    {flag}
                  </div>
                ))}
              </div>
            </div>

            <div className="tv-dist-divider" style={{ margin: '14px 0' }} />

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Cumulative Inflow</span>
              <span className="mono font-medium">{selectedNode.inflow}</span>
            </div>

            <div className="tv-inspector-field">
              <span className="tv-inspector-label">Cumulative Outflow</span>
              <span className="mono font-medium">{selectedNode.outflow}</span>
            </div>

            <div className="tv-inspector-actions" style={{ marginTop: '20px' }}>
              <button className="tv-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <FileText size={13} />
                <span>Create Evidence Exhibit</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-muted" style={{ padding: '20px 0', fontSize: '12px' }}>
            Click on any graph node to inspect forensic attributes.
          </div>
        )}
      </div>
    </div>
  );
}
