export const generateMockCase = (caseId, wallet) => ({
  caseId: caseId || 'CASE-001',
  title: 'Suspicious Exchange Deposit Trace',
  subjectWallet: wallet || '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  blockchain: 'ethereum',
  status: 'ANALYSIS_COMPLETE',
  created: new Date().toISOString(),
  riskScore: 78,
  riskLevel: 'HIGH',
  attribution: {
    entity: 'Binance',
    type: 'Exchange',
    confidence: 85,
    distance: 3,
  },
  summary: 'Wallet exhibits behavior consistent with mixing service interaction followed by rapid deposit to a known exchange entity.'
});

export const mockNodes = [
  { id: '1', type: 'wallet', data: { label: 'Suspicious Wallet', address: '0x7a2...88d', risk: 'high', type: 'source' }, position: { x: 50, y: 150 } },
  { id: '2', type: 'wallet', data: { label: 'Intermediary 1', address: '0x1c3...4f2', risk: 'medium', type: 'intermediary' }, position: { x: 300, y: 100 } },
  { id: '3', type: 'wallet', data: { label: 'Intermediary 2', address: '0x4d5...1a9', risk: 'low', type: 'intermediary' }, position: { x: 300, y: 200 } },
  { id: '4', type: 'wallet', data: { label: 'Deposit Wallet', address: '0x99a...c33', risk: 'low', type: 'deposit' }, position: { x: 550, y: 150 } },
  { id: '5', type: 'vasp', data: { label: 'Binance', type: 'vasp' }, position: { x: 800, y: 150 } }
];

export const mockEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '14.5 ETH', animated: true },
  { id: 'e1-3', source: '1', target: '3', label: '8.2 ETH', animated: true },
  { id: 'e2-4', source: '2', target: '4', label: '14.5 ETH', animated: true },
  { id: 'e3-4', source: '3', target: '4', label: '8.2 ETH', animated: true },
  { id: 'e4-5', source: '4', target: '5', label: '22.7 ETH', animated: true }
];

export const mockEvidence = [
  { id: 'EV-01', type: 'Transaction', hash: '0xabc...def', from: '0x7a2...88d', to: '0x1c3...4f2', amount: '14.5', asset: 'ETH', relevance: 'High' },
  { id: 'EV-02', type: 'Entity Tag', tag: 'Binance Hot Wallet', source: 'Global Intelligence Base', confidence: 'High', relevance: 'High' },
  { id: 'EV-03', type: 'Behavior', description: 'Rapid fund movement (< 5 mins)', relevance: 'Medium' }
];

export const mockCases = [
  generateMockCase('CASE-001', '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'),
  generateMockCase('CASE-002', '0x9923849382901ab29384920019283401923abcdf'),
  generateMockCase('CASE-003', '0x1111111111111111111111111111111111111111')
];
