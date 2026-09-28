/**
 * TRACEVAULT V2 — Canonical Normalization & ViewModel Transformation Layer
 * Bridges backend AnalysisResult contracts to investigation UI components.
 */

const assetByLedger = {
  ethereum: 'ETH',
  bitcoin: 'BTC',
  tron: 'USDT',
  polygon: 'USDC'
};

/**
 * Normalizes a raw case record from the backend
 */
export function normalizeCase(rawCase) {
  if (!rawCase) return null;

  const caseId = rawCase.case_id || rawCase.id || 'CASE-UNKNOWN';
  const blockchain = (rawCase.blockchain || 'ethereum').toLowerCase();
  const analysis = rawCase.analysis || null;
  const riskObj = analysis?.risk || {};

  return {
    id: caseId,
    case_id: caseId,
    name: rawCase.title || caseId,
    title: rawCase.title || caseId,
    description: rawCase.description || '',
    crime_type: rawCase.crime_type || 'GENERAL_INVESTIGATION',
    priority: rawCase.priority || 'MEDIUM',
    status: rawCase.status || 'OPEN',
    blockchain: blockchain.charAt(0).toUpperCase() + blockchain.slice(1),
    blockchainRaw: blockchain,
    wallet: rawCase.subject_identifier || analysis?.wallet || 'Not specified',
    subject_identifier: rawCase.subject_identifier || analysis?.wallet || null,
    riskLevel: riskObj.level || rawCase.priority || 'LOW',
    riskScore: typeof riskObj.score === 'number' ? Math.round(riskObj.score) : 0,
    created: rawCase.created_at ? new Date(rawCase.created_at).toLocaleString() : 'Recent',
    updated: rawCase.updated_at ? new Date(rawCase.updated_at).toLocaleString() : 'Recent',
    analysis
  };
}

/**
 * Transforms backend graph structure into React Flow compatible nodes and edges
 */
export function transformAnalysisToGraph(analysisResult, caseData = {}) {
  const blockchain = (analysisResult?.blockchain || caseData?.blockchain || 'ethereum').toLowerCase();
  const asset = assetByLedger[blockchain] || 'ETH';
  const subjectWallet = analysisResult?.wallet || analysisResult?.subject || caseData?.subject_identifier || '';

  const rawNodes = analysisResult?.graph?.nodes || [];
  const rawEdges = analysisResult?.graph?.edges || [];
  const primaryPathNodes = analysisResult?.paths?.[0]?.nodes || [];
  const primaryPathNodeSet = new Set(primaryPathNodes);

  // If no graph exists yet, construct minimal single-node graph
  if (rawNodes.length === 0) {
    if (!subjectWallet) {
      return { nodes: [], edges: [], primaryPathNodeIds: [] };
    }
    return {
      nodes: [
        {
          id: subjectWallet,
          type: 'wallet',
          position: { x: 400, y: 220 },
          data: {
            category: 'suspect',
            depth: 0,
            direction: 'both',
            label: 'Subject Wallet',
            address: subjectWallet,
            risk: analysisResult?.risk?.level || 'LOW',
            metadata: {
              transactionCount: 0,
              indicators: ['Initial intake — analysis pending']
            }
          }
        }
      ],
      edges: [],
      primaryPathNodeIds: [subjectWallet]
    };
  }

  // Calculate distance/hop depth for each node relative to subject
  const depthMap = new Map();
  depthMap.set(subjectWallet, 0);

  // Use primary path sequence if available
  primaryPathNodes.forEach((nodeId, idx) => {
    depthMap.set(nodeId, idx);
  });

  // Assign remaining nodes based on edge traversals
  rawEdges.forEach((edge) => {
    const s = edge.source || edge.from;
    const t = edge.target || edge.to;
    if (depthMap.has(s) && !depthMap.has(t)) {
      depthMap.set(t, depthMap.get(s) + 1);
    }
  });

  // Group nodes by depth for non-overlapping vertical layout
  const depthGroups = new Map();
  rawNodes.forEach((n) => {
    const d = depthMap.get(n.id) ?? 1;
    if (!depthGroups.has(d)) depthGroups.set(d, []);
    depthGroups.get(d).push(n);
  });

  const nodes = [];
  const xSpacing = 240;
  const startX = 20;

  depthGroups.forEach((groupNodes, depth) => {
    const totalInGroup = groupNodes.length;
    const yStart = 225 - ((totalInGroup - 1) * 120) / 2;

    groupNodes.forEach((node, index) => {
      const isSubject = node.id === subjectWallet;
      const isDeposit = node.entity_type === 'DEPOSIT_WALLET' || node.entity_type === 'EXCHANGE';
      const isVasp = node.entity_type === 'VASP';
      const isMixer = node.entity_type === 'MIXER' || (node.risk_score && node.risk_score >= 80);
      const isIntermediary = !isSubject && !isDeposit && !isVasp && !isMixer;

      let type = 'wallet';
      let category = 'unknown';

      if (isSubject) {
        type = 'wallet';
        category = 'suspect';
      } else if (isVasp) {
        type = 'vasp';
        category = 'vasp';
      } else if (isDeposit) {
        type = 'exchangeDeposit';
        category = 'exchange';
      } else if (isMixer) {
        type = 'wallet';
        category = 'risk';
      } else if (isIntermediary) {
        type = 'intermediary';
        category = 'intermediary';
      }

      nodes.push({
        id: node.id,
        type,
        position: {
          x: startX + depth * xSpacing,
          y: Math.max(30, yStart + index * 130)
        },
        data: {
          category,
          depth,
          direction: depth === 0 ? 'both' : 'outgoing',
          label: node.label || (isSubject ? 'Subject Wallet' : isDeposit ? 'Deposit Address' : isVasp ? 'Attributed VASP' : node.id),
          address: node.id,
          entity: node.entity || (isVasp || isDeposit ? analysisResult?.nearest_vasp?.name : undefined),
          confidence: analysisResult?.confidence,
          risk: node.risk_score >= 70 ? 'HIGH' : node.risk_score >= 40 ? 'MEDIUM' : 'LOW',
          metadata: {
            transactionCount: node.transaction_count || 1,
            entityType: node.entity_type || 'WALLET',
            riskScore: node.risk_score || 0,
            indicators: isMixer ? ['High-risk privacy protocol interaction'] : []
          }
        }
      });
    });
  });

  // Map edges
  const edges = rawEdges.map((edge, index) => {
    const source = edge.source || edge.from;
    const target = edge.target || edge.to;
    const edgeId = edge.tx_hash || `tx-edge-${index}`;
    const amountVal = typeof edge.amount === 'number' ? edge.amount.toFixed(2) : String(edge.amount || '0.0');
    const isPrimary = primaryPathNodeSet.has(source) && primaryPathNodeSet.has(target);

    return {
      id: edgeId,
      source,
      target,
      type: 'transaction',
      data: {
        amount: amountVal,
        asset,
        txHash: edge.tx_hash || edgeId,
        timestamp: edge.timestamp ? new Date(edge.timestamp).toISOString() : new Date().toISOString(),
        direction: 'outgoing',
        isPrimaryPath: isPrimary,
        isAssociation: edge.is_association || false
      }
    };
  });

  return {
    nodes,
    edges,
    primaryPathNodeIds: primaryPathNodes.length > 0 ? primaryPathNodes : [subjectWallet]
  };
}

/**
 * Normalizes full investigation state combining case, analysis, and evidence
 */
export function normalizeInvestigation(rawCase, rawAnalysis = null, rawEvidence = []) {
  if (!rawCase) return null;

  const normalizedCase = normalizeCase(rawCase);
  const analysis = rawAnalysis || normalizedCase.analysis || null;
  const blockchain = (rawCase.blockchain || 'ethereum').toLowerCase();
  const asset = assetByLedger[blockchain] || 'ETH';
  const nearestVasp = analysis?.nearest_vasp;
  const hasProbableVasp = Boolean(nearestVasp?.name);
  const attributionCandidate = analysis?.attribution?.candidates?.[0] || null;

  const hopsCount = nearestVasp?.hops ?? (analysis?.paths?.[0]?.hops || 0);
  const confidenceScore = typeof analysis?.confidence === 'number' ? analysis.confidence : 0;
  const confidenceLabel = analysis?.confidence_label || (confidenceScore >= 70 ? 'High confidence' : confidenceScore >= 40 ? 'Moderate confidence' : 'Low confidence');

  const riskObj = analysis?.risk || {};
  const riskScore = typeof riskObj.score === 'number' ? Math.round(riskObj.score) : normalizedCase.riskScore;
  const riskLevel = riskObj.level || normalizedCase.riskLevel;

  // Evidence list priority: direct rawEvidence > analysis.evidence > empty
  const evidenceList = (rawEvidence && rawEvidence.length > 0)
    ? rawEvidence
    : (analysis?.evidence || []);

  const normalizedEvidence = evidenceList.map((ev, idx) => ({
    id: ev.evidence_id || `EV-${String(idx + 1).padStart(3, '0')}`,
    evidence_id: ev.evidence_id || `EV-${String(idx + 1).padStart(3, '0')}`,
    type: ev.type || ev.evidence_type || 'TRANSACTION',
    title: ev.description ? ev.description.slice(0, 48) : `Evidence item ${idx + 1}`,
    description: ev.description || '',
    source: ev.source || 'Blockchain Ledger',
    relevance: ev.relevance || 'HIGH',
    status: ev.status || 'Verified',
    timestamp: ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Verified on-chain',
    amount: ev.amount ? `${ev.amount} ${ev.asset || asset}` : undefined,
    txHash: ev.transaction_hash || undefined,
    address: ev.entity || ev.from_address || ev.to_address || undefined
  }));

  // Risk indicators list
  const signalsList = riskObj.signals || [];
  const normalizedIndicators = signalsList.length > 0
    ? signalsList.map((sig) => ({
        label: sig.signal_type ? sig.signal_type.replace(/_/g, ' ') : (sig.description || 'Risk signal'),
        value: typeof sig.score === 'number' ? Math.round(sig.score) : 50,
        severity: sig.severity || 'MEDIUM',
        description: sig.description || sig.reason || ''
      }))
    : [
        { label: 'Overall Investigative Risk', value: riskScore, severity: riskLevel, description: riskObj.explanation || 'Composite analytical risk score' }
      ];

  // Graph transformation
  const graph = transformAnalysisToGraph(analysis, normalizedCase);

  // Attribution summary
  const attribution = {
    hasProbableVasp,
    entityName: nearestVasp?.name || null,
    displayName: nearestVasp?.name || 'No probable VASP identified',
    status: hasProbableVasp
      ? (hopsCount <= 1 ? 'Direct deposit match' : 'Multi-hop association')
      : 'Insufficient confidence',
    confidence: confidenceScore,
    confidenceLabel,
    hops: hopsCount,
    entityType: attributionCandidate?.entity_type || 'VASP / Exchange',
    source: attributionCandidate?.source || 'Verified VASP Registry',
    method: attributionCandidate?.method || 'NetworkX BFS Traversal + Heuristic Attribution',
    explanation: attributionCandidate?.reason || riskObj.explanation || 'Association derived from shortest transaction path to a known deposit wallet.',
    reliability: attributionCandidate?.reliability || 'VERIFIED',
    candidates: analysis?.attribution?.candidates || []
  };

  // Primary Path
  const primaryNodes = analysis?.paths?.[0]?.nodes || [];
  const path = {
    totalHops: hopsCount,
    destination: nearestVasp?.name || 'Unattributed',
    hops: primaryNodes.map((nodeId, idx) => ({
      index: idx,
      node: nodeId,
      role: idx === 0 ? 'Suspect Wallet' : idx === primaryNodes.length - 1 ? (hasProbableVasp ? `${nearestVasp.name} Deposit` : 'Destination') : `Hop ${idx} Intermediary`,
      address: nodeId
    })),
    nodes: primaryNodes
  };

  // Risk assessment viewmodel
  const risk = {
    score: riskScore,
    level: riskLevel,
    explanation: riskObj.explanation || 'Analytical assessment based on graph distance and entity associations.',
    signals: signalsList,
    indicators: normalizedIndicators
  };

  return {
    ...normalizedCase,
    wallet: normalizedCase.wallet,
    hops: hopsCount,
    confidence: confidenceScore,
    vasp: nearestVasp?.name || (hasProbableVasp ? nearestVasp.name : 'No probable VASP identified'),
    transactions: analysis?.graph?.edges?.length || 0,
    flow: analysis?.paths?.[0]?.total_amount ? `${analysis.paths[0].total_amount} ${asset}` : `0.00 ${asset}`,
    pathCount: analysis?.paths?.length || 0,
    indicators: normalizedIndicators,
    workflow: analysis ? 'Analysis complete — ready for investigator review' : 'Intake complete — analysis pending',
    investigator: 'T. JD · LE ID #8327A',
    graph,
    intelligence: {
      attribution,
      path,
      risk,
      evidence: normalizedEvidence,
      reasoningTrace: analysis?.nearest_vasp?.metadata?.reasoning_trace || analysis?.metadata?.reasoning_trace || [],
      graph,
      addresses: {
        exchangeDeposit: nearestVasp?.deposit_address || primaryNodes[primaryNodes.length - 1] || ''
      }
    }
  };
}
