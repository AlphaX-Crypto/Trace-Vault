import { normalizeInvestigation } from '../services/normalizer';

const STORAGE_KEY = 'tracevault.current-investigation';
const memoryCache = new Map();

export function saveCurrentInvestigation(investigation) {
  if (!investigation) return;
  const id = investigation.id || investigation.case_id;
  if (id) {
    memoryCache.set(id, investigation);
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(investigation));
  } catch (_) {
    // Non-critical session storage fallback
  }
}

export function getCurrentInvestigation() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getInvestigationById(id) {
  if (memoryCache.has(id)) {
    return memoryCache.get(id);
  }
  const current = getCurrentInvestigation();
  if (current && (current.id === id || current.case_id === id)) {
    return current;
  }

  // Graceful fallback representation for initial sync render before async hook loads
  return normalizeInvestigation({
    case_id: id,
    title: 'Loading Case...',
    status: 'OPEN',
    blockchain: 'ethereum',
    subject_identifier: ''
  });
}
