import { generateMockCase, mockNodes, mockEdges, mockEvidence, mockCases } from './mockData';

// API Service Layer
// Replace mock implementations with actual fetch/axios calls when backend is ready

export const api = {
  // Case Management
  getCases: async () => {
    return new Promise((resolve) => setTimeout(() => resolve(mockCases), 500));
  },
  
  getCase: async (caseId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = mockCases.find(c => c.caseId === caseId);
        resolve(found || generateMockCase(caseId));
      }, 500);
    });
  },

  // Intelligence
  analyzeWallet: async (data) => {
    // Expected request: { case_id, blockchain, wallet_address }
    return new Promise((resolve) => {
      setTimeout(() => resolve({ status: 'started', caseId: data.case_id }), 1000);
    });
  },

  getGraphData: async (caseId) => {
    return new Promise((resolve) => setTimeout(() => resolve({ nodes: mockNodes, edges: mockEdges }), 800));
  },

  getEvidence: async (caseId) => {
    return new Promise((resolve) => setTimeout(() => resolve(mockEvidence), 600));
  }
};
