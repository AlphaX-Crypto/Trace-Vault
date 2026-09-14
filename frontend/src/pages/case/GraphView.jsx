import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WalletNode, VaspNode } from '../../components/graph/CustomNodes';
import { api } from '../../services/api';
import './GraphView.css';

const nodeTypes = {
  wallet: WalletNode,
  vasp: VaspNode,
};

const GraphView = () => {
  const { caseId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGraphData(caseId).then((data) => {
      setNodes(data.nodes);
      setEdges(data.edges);
      setLoading(false);
    });
  }, [caseId, setNodes, setEdges]);

  if (loading) return <div className="loading mono">LOADING GRAPH DATA...</div>;

  return (
    <div className="graph-container card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="trace-graph"
        minZoom={0.2}
      >
        <Background color="var(--border-highlight)" gap={16} />
        <Controls />
        
        <Panel position="top-right" className="graph-legend card">
          <h4>Legend</h4>
          <div className="legend-item"><span className="legend-color" style={{backgroundColor: 'var(--risk-high)'}}></span> Suspicious Wallet</div>
          <div className="legend-item"><span className="legend-color" style={{backgroundColor: 'var(--border-highlight)'}}></span> Intermediary</div>
          <div className="legend-item"><span className="legend-color" style={{backgroundColor: 'var(--accent-secondary)'}}></span> Deposit Wallet</div>
          <div className="legend-item"><span className="legend-color" style={{backgroundColor: 'var(--accent-primary)'}}></span> VASP</div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default GraphView;
