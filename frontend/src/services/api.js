/**
 * TRACEVAULT V2 — Centralized Frontend API Service
 * Communicates with the Node.js/Express Backend Orchestration Layer.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '3000' ? '' : 'http://localhost:5000')
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 25000;

class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standardized HTTP request handler with timeout, headers, and error extraction
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Try parsing JSON response
    let json = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await response.json();
      } catch (_) {
        json = null;
      }
    }

    if (!response.ok) {
      const code = json?.error?.code || `HTTP_${response.status}`;
      const message = json?.error?.message || response.statusText || 'Request failed';
      const details = json?.error?.details || null;
      throw new ApiError(message, response.status, code, details);
    }

    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out while waiting for server response.', 504, 'TIMEOUT_ERROR');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connection failed. Verify that backend service is running.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // System Health
  checkHealth: () => request('/health'),
  checkIntelligenceHealth: () => request('/health/intelligence'),

  // Case Management
  getCases: async () => {
    const res = await request('/api/cases');
    return res.data || [];
  },

  getCase: async (id) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}`);
    return res.data;
  },

  createCase: async (payload) => {
    const res = await request('/api/cases', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  // Wallet Analysis & Intelligence Orchestration
  analyzeCase: async (id, payload) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}/analyze`, {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 45000 // Extended timeout for multi-hop graph analysis
    });
    return res.data;
  },

  getAnalysis: async (id) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}/analysis`);
    return res.data;
  },

  getEvidence: async (id) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}/evidence`);
    return res.data || [];
  },

  getResults: async (id) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}/results`);
    return res.data || [];
  },

  // LEA Disclosure Workflow
  createDisclosureRequest: async (id, payload) => {
    const res = await request(`/api/cases/${encodeURIComponent(id)}/disclosure-request`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }
};

export { ApiError, API_BASE_URL };
export default api;
