import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Shield, AlertTriangle, ArrowRightLeft, Building } from 'lucide-react';
import './CustomNodes.css';

const getNodeStyle = (type, risk) => {
  let baseClass = 'custom-node ';
  if (type === 'source') baseClass += 'node-source ';
  if (type === 'intermediary') baseClass += 'node-intermediary ';
  if (type === 'deposit') baseClass += 'node-deposit ';
  if (type === 'vasp') baseClass += 'node-vasp ';

  if (risk === 'high') baseClass += 'risk-high ';
  if (risk === 'medium') baseClass += 'risk-medium ';
  if (risk === 'low') baseClass += 'risk-low ';

  return baseClass;
};

const getNodeIcon = (type) => {
  switch (type) {
    case 'source': return <AlertTriangle size={16} />;
    case 'intermediary': return <ArrowRightLeft size={16} />;
    case 'deposit': return <ArrowRightLeft size={16} />;
    case 'vasp': return <Building size={16} />;
    default: return <Shield size={16} />;
  }
};

export const WalletNode = ({ data, type }) => {
  const nodeType = data.type || type;
  
  return (
    <div className={getNodeStyle(nodeType, data.risk)}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <span className="node-icon">{getNodeIcon(nodeType)}</span>
        <span className="node-label">{data.label}</span>
      </div>
      {data.address && (
        <div className="node-address mono">
          {data.address.slice(0, 6)}...{data.address.slice(-4)}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
};

export const VaspNode = ({ data }) => {
  return (
    <div className="custom-node node-vasp">
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <Building size={16} className="node-icon" />
        <span className="node-label">{data.label}</span>
      </div>
      <div className="node-tag">KNOWN VASP</div>
    </div>
  );
};
