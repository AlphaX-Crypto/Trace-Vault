import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createGraphMockData, primaryPathNodeIds as defaultPrimaryPathNodeIds } from '../../data/graphMockData';
import WalletNode from './WalletNode';
import IntermediaryNode from './IntermediaryNode';
import ExchangeDepositNode from './ExchangeDepositNode';
import VaspNode from './VaspNode';
import TransactionEdge from './TransactionEdge';
import GraphToolbar from './GraphToolbar';
import GraphLegend from './GraphLegend';
import NodeInspector from './NodeInspector';
import './graph.css';

const nodeTypes = {
  wallet: WalletNode,
  intermediary: IntermediaryNode,
  exchangeDeposit: ExchangeDepositNode,
  vasp: VaspNode
};
const edgeTypes = {
  transaction: TransactionEdge
};
const initialFilters = {
  unknown: true,
  intermediary: true,
  risk: true,
  vasp: true
};

export default function TransactionGraph({ investigation }) {
  // Use real backend-generated graph when present, fallback gracefully if empty
  const graph = useMemo(() => {
    if (investigation?.graph?.nodes?.length > 0) {
      return investigation.graph;
    }
    return createGraphMockData(investigation);
  }, [investigation]);

  const primaryPathNodeIds = useMemo(() => {
    if (graph.primaryPathNodeIds && graph.primaryPathNodeIds.length > 0) {
      return graph.primaryPathNodeIds;
    }
    if (investigation?.intelligence?.path?.nodes && investigation.intelligence.path.nodes.length > 0) {
      return investigation.intelligence.path.nodes;
    }
    return defaultPrimaryPathNodeIds;
  }, [graph, investigation]);

  const [hopDepth, setHopDepth] = useState(3);
  const [direction, setDirection] = useState('Outgoing');
  const [filters, setFilters] = useState(initialFilters);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [instance, setInstance] = useState(null);

  const nodes = useMemo(
    () =>
      graph.nodes
        .filter((node) => {
          const categoryVisible =
            node.data.category === 'suspect' ||
            node.data.category === 'exchange' ||
            node.data.category === 'vasp' ||
            filters[node.data.category] !== false;
          const directionVisible =
            direction === 'Both' ||
            node.data.direction === 'both' ||
            node.data.direction === direction.toLowerCase();
          const depthMatches = (node.data.depth ?? 0) <= hopDepth;
          return depthMatches && categoryVisible && directionVisible;
        })
        .map((node) => ({
          ...node,
          data: {
            ...node.data,
            highlighted: isHighlighted && primaryPathNodeIds.includes(node.id),
            dimmed: isHighlighted && !primaryPathNodeIds.includes(node.id)
          }
        })),
    [direction, filters, graph.nodes, hopDepth, isHighlighted, primaryPathNodeIds]
  );

  const visibleIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);

  const edges = useMemo(
    () =>
      graph.edges
        .filter(
          (edge) =>
            visibleIds.has(edge.source) &&
            visibleIds.has(edge.target) &&
            (direction === 'Both' || edge.data.direction === direction.toLowerCase())
        )
        .map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            risk: edge.source === 'risk-service' || edge.target === 'risk-service',
            highlighted: isHighlighted && edge.data.isPrimaryPath,
            dimmed: isHighlighted && !edge.data.isPrimaryPath
          }
        })),
    [direction, graph.edges, isHighlighted, visibleIds]
  );

  useEffect(() => {
    if (selectedNode && !visibleIds.has(selectedNode.id)) setSelectedNode(null);
  }, [selectedNode, visibleIds]);

  const toggleFilter = useCallback((key) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const fitView = useCallback(() => {
    instance?.fitView({ padding: 0.16, duration: 350 });
  }, [instance]);

  return (
    <section className="transaction-graph">
      <GraphToolbar
        hopDepth={hopDepth}
        onHopDepthChange={setHopDepth}
        direction={direction}
        onDirectionChange={setDirection}
        filters={filters}
        onFilterChange={toggleFilter}
        isHighlighted={isHighlighted}
        onToggleHighlight={() => setIsHighlighted((value) => !value)}
        onFitView={fitView}
      />
      <div className="graph-workspace">
        <div className="graph-canvas" aria-label="Interactive transaction graph">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={setInstance}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            nodesDraggable={true}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            minZoom={0.4}
            maxZoom={1.75}
            defaultEdgeOptions={{ type: 'transaction' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1d3340" />
            <Controls position="bottom-right" showInteractive={false} />
            <GraphLegend />
          </ReactFlow>
        </div>
        <NodeInspector node={selectedNode} />
      </div>
    </section>
  );
}
