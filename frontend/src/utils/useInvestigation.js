import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { normalizeInvestigation } from '../services/normalizer';

const memoryCache = new Map();

/**
 * Custom hook to fetch, normalize, and manage investigation state from the real backend.
 * Handles loading, error, and empty states.
 */
export function useInvestigation(caseId, initialData = null) {
  const [investigation, setInvestigation] = useState(() => {
    if (initialData) return initialData;
    if (caseId && memoryCache.has(caseId)) return memoryCache.get(caseId);
    return null;
  });
  const [loading, setLoading] = useState(!initialData && Boolean(caseId));
  const [error, setError] = useState(null);

  const fetchInvestigation = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch case record
      const caseRecord = await api.getCase(caseId);
      if (!caseRecord) {
        throw new Error(`Case '${caseId}' was not found.`);
      }

      // 2. Fetch analysis if available (don't fail if unanalyzed 404)
      let analysisRecord = null;
      try {
        analysisRecord = await api.getAnalysis(caseId);
      } catch (err) {
        if (err.status !== 404) {
          console.warn(`Could not load analysis for ${caseId}:`, err.message);
        }
      }

      // 3. Fetch evidence schedule
      let evidenceRecords = [];
      try {
        evidenceRecords = await api.getEvidence(caseId);
      } catch (err) {
        console.warn(`Could not load evidence for ${caseId}:`, err.message);
      }

      const normalized = normalizeInvestigation(caseRecord, analysisRecord, evidenceRecords);
      memoryCache.set(caseId, normalized);
      setInvestigation(normalized);
    } catch (err) {
      console.error(`Failed to load investigation ${caseId}:`, err);
      setError(err.message || 'Unable to retrieve investigation data.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchInvestigation();
  }, [fetchInvestigation]);

  return {
    investigation,
    loading,
    error,
    reload: fetchInvestigation
  };
}

export default useInvestigation;
