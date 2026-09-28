/**
 * TRACEVAULT V2 — Centralized Frontend API Service
 * Communicates with the Node.js/Express Backend Orchestration Layer.
 */

import { PRESET_SCENARIOS_SUMMARY, getLocalScenarioResult } from '../data/investigationScenarios';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '3000' ? '' : 'http://localhost:5000')
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 25000;

let currentAuthToken = null;

export function setAuthToken(token) {
  currentAuthToken = token;
}

export function getAuthToken() {
  return currentAuthToken;
}

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
    ...(currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {}),
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
  // Authentication & Session
  login: async (credentials) => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return res.data;
  },

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      // Graceful local cleanup even if network fails
    }
  },

  getMe: async () => {
    const res = await request('/api/auth/me');
    return res.data;
  },

  getUsers: async () => {
    const res = await request('/api/auth/users');
    return res.data || [];
  },

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
  },

  // Phase 17 Unified Investigation Orchestration Endpoints
  getInvestigationScenarios: async () => {
    try {
      const res = await request('/api/investigations/scenarios');
      return res.data?.scenarios || res.scenarios || PRESET_SCENARIOS_SUMMARY;
    } catch (err) {
      console.warn('Backend scenarios unavailable, using deterministic fallbacks:', err.message);
      return PRESET_SCENARIOS_SUMMARY;
    }
  },

  createInvestigation: async (payload) => {
    try {
      const res = await request('/api/investigations', {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 45000
      });
      return res.data || res;
    } catch (err) {
      console.warn('Backend investigation execution failed or unavailable, using deterministic scenario fallback:', err.message);
      return getLocalScenarioResult(payload.scenario || payload.case_id || 'INV-004');
    }
  },

  getInvestigation: async (id) => {
    try {
      const res = await request(`/api/investigations/${encodeURIComponent(id)}`);
      return res.data || res;
    } catch (err) {
      console.warn(`Investigation '${id}' unavailable from backend, using deterministic fallback:`, err.message);
      return getLocalScenarioResult(id);
    }
  },

  runInvestigation: async (id, payload = {}) => {
    try {
      const res = await request(`/api/investigations/${encodeURIComponent(id)}/run`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.data || res;
    } catch (err) {
      console.warn(`Re-run investigation '${id}' unavailable, using fallback:`, err.message);
      return getLocalScenarioResult(id);
    }
  },

  getInvestigationTimeline: async (id) => {
    try {
      const res = await request(`/api/investigations/${encodeURIComponent(id)}/timeline`);
      return res.data || res;
    } catch (err) {
      const inv = getLocalScenarioResult(id);
      return { investigation_id: id, timeline: inv?.timeline || [], event_count: inv?.timeline?.length || 0 };
    }
  },

  getInvestigationEvidence: async (id) => {
    try {
      const res = await request(`/api/investigations/${encodeURIComponent(id)}/evidence`);
      return res.data || res;
    } catch (err) {
      const inv = getLocalScenarioResult(id);
      return { investigation_id: id, evidence_items: inv?.evidence_items || [], evidence_count: inv?.evidence_items?.length || 0 };
    }
  },

  getInvestigationGraph: async (id) => {
    try {
      const res = await request(`/api/investigations/${encodeURIComponent(id)}/graph`);
      return res.data || res;
    } catch (err) {
      const inv = getLocalScenarioResult(id);
      return {
        investigation_id: id,
        graph_summary: inv?.graph_summary || {},
        graph_paths: inv?.graph_paths || [],
        cross_rail_associations: inv?.cross_rail_associations || []
      };
    }
  }
};

export { ApiError, API_BASE_URL };
export default api;

