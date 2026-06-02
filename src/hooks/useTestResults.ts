import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface CachedTestResult {
  id: string;
  timestamp: number;
  mode: string;
  modeOption: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
}

// Covers ActivityHeatmap's widest range (12 months). ResultsTable filters locally.
const FETCH_WINDOW_MS = 365 * 86_400_000;
const CACHE_TTL_MS = 60_000;

const resultCache = new Map<string, { results: CachedTestResult[]; fetchedAt: number }>();
const pending = new Map<string, Promise<CachedTestResult[]>>();

function fetchFromFirestore(uid: string): Promise<CachedTestResult[]> {
  if (pending.has(uid)) return pending.get(uid)!;

  const cutoff = Date.now() - FETCH_WINDOW_MS;
  const p = getDocs(query(
    collection(db, 'testResults', uid, 'results'),
    where('timestamp', '>=', cutoff),
    orderBy('timestamp', 'desc'),
  )).then(snap => {
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as CachedTestResult));
    resultCache.set(uid, { results, fetchedAt: Date.now() });
    pending.delete(uid);
    return results;
  }).catch(err => {
    pending.delete(uid);
    throw err;
  });

  pending.set(uid, p);
  return p;
}

export function useTestResults(uid: string | undefined) {
  const [results, setResults] = useState<CachedTestResult[]>(() => {
    if (!uid) return [];
    const hit = resultCache.get(uid);
    return hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS ? hit.results : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const hit = resultCache.get(uid);
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
      setResults(hit.results);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    fetchFromFirestore(uid)
      .then(r => { setResults(r); setLoading(false); })
      .catch(err => {
        const code = (err as { code?: string }).code;
        setError(
          code === 'permission-denied'
            ? 'permission denied — check your Firestore rules for testResults'
            : `failed to load results (${(err as Error).message ?? 'unknown'})`,
        );
        setLoading(false);
      });
  }, [uid]);

  return { results, loading, error };
}

/** Call after saving a new test result so the next page visit re-fetches. */
export function invalidateTestResultsCache(uid: string) {
  resultCache.delete(uid);
}
