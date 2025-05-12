// Utility functions for handling RPC requests

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 32000; // 32 seconds
const MAX_RETRIES = 5;

interface BackoffState {
  attempt: number;
  backoff: number;
  lastAttempt: number;
}

const backoffStates = new Map<string, BackoffState>();

export const shouldThrottle = (key: string): boolean => {
  const state = backoffStates.get(key);
  if (!state) return false;

  const now = Date.now();
  return now - state.lastAttempt < state.backoff;
};

export const updateBackoff = (key: string, success: boolean) => {
  const now = Date.now();
  const state = backoffStates.get(key) || { attempt: 0, backoff: INITIAL_BACKOFF, lastAttempt: 0 };

  if (success) {
    // Reset on success
    backoffStates.delete(key);
    return;
  }

  // Update backoff on failure
  const newState = {
    attempt: state.attempt + 1,
    backoff: Math.min(INITIAL_BACKOFF * Math.pow(2, state.attempt), MAX_BACKOFF),
    lastAttempt: now
  };

  if (newState.attempt > MAX_RETRIES) {
    backoffStates.delete(key);
  } else {
    backoffStates.set(key, newState);
  }
};

export const getBackoffDelay = (key: string): number => {
  const state = backoffStates.get(key);
  if (!state) return 0;
  
  const now = Date.now();
  const timeElapsed = now - state.lastAttempt;
  return Math.max(0, state.backoff - timeElapsed);
};

export const clearBackoff = (key: string) => {
  backoffStates.delete(key);
}; 