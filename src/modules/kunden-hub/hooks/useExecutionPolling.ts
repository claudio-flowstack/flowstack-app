import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { ExecutionStatus } from '../services/api';

interface UseExecutionPollingOptions {
  /** Polling interval in milliseconds. Default: 5000 */
  intervalMs?: number;
  /** Stop polling when all nodes are completed or failed. Default: true */
  stopOnComplete?: boolean;
}

interface UseExecutionPollingReturn {
  execution: ExecutionStatus | null;
  loading: boolean;
  error: string | null;
  /** True when 3+ consecutive polls have failed */
  connectionLost: boolean;
  /** Force an immediate re-fetch */
  refetch: () => void;
}

function isExecutionDone(execution: ExecutionStatus): boolean {
  const nodes = Object.values(execution.nodes);
  if (nodes.length === 0) return false;
  return nodes.every(
    (n) => n.status === 'completed' || n.status === 'failed',
  );
}

const MAX_INTERVAL = 30000;
const CONSECUTIVE_ERRORS_THRESHOLD = 3;

/**
 * Polls execution status for a given execution ID.
 * Shows connectionLost after 3 consecutive errors.
 * Backs off interval on errors (doubles each time, max 30s).
 */
export function useExecutionPolling(
  executionId: string | null,
  options: UseExecutionPollingOptions = {},
): UseExecutionPollingReturn {
  const { intervalMs = 5000, stopOnComplete = true } = options;

  const [execution, setExecution] = useState<ExecutionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);
  const stoppedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const currentIntervalRef = useRef(intervalMs);

  const restartInterval = useCallback((newInterval: number) => {
    // Always clear existing interval first
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    currentIntervalRef.current = newInterval;
    // Only start new interval if not stopped
    if (!stoppedRef.current) {
      intervalRef.current = window.setInterval(() => {
        void pollFn.current?.();
      }, newInterval);
    }
  }, []);

  const pollFn = useRef<(() => Promise<void>) | null>(null);

  const poll = useCallback(async () => {
    if (!executionId || stoppedRef.current) return;
    try {
      setLoading(true);
      const data = await api.execution.getStatus(executionId);
      setExecution(data);
      setError(null);

      // Reset error tracking on success
      if (consecutiveErrorsRef.current > 0) {
        consecutiveErrorsRef.current = 0;
        setConnectionLost(false);
        // Restore normal interval
        if (currentIntervalRef.current !== intervalMs) {
          restartInterval(intervalMs);
        }
      }

      if (stopOnComplete && isExecutionDone(data)) {
        stoppedRef.current = true;
        if (intervalRef.current !== undefined) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Polling fehlgeschlagen';
      setError(message);
      consecutiveErrorsRef.current += 1;

      if (consecutiveErrorsRef.current >= CONSECUTIVE_ERRORS_THRESHOLD) {
        setConnectionLost(true);
        // Back off: double interval, max 30s
        const newInterval = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
        if (newInterval !== currentIntervalRef.current) {
          restartInterval(newInterval);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [executionId, stopOnComplete, intervalMs, restartInterval]);

  // Keep ref updated for interval callback
  pollFn.current = poll;

  useEffect(() => {
    if (!executionId) {
      setExecution(null);
      setError(null);
      setConnectionLost(false);
      consecutiveErrorsRef.current = 0;
      return;
    }

    stoppedRef.current = false;
    consecutiveErrorsRef.current = 0;
    currentIntervalRef.current = intervalMs;

    // Initial fetch
    void poll();

    // Start interval
    intervalRef.current = window.setInterval(() => {
      void pollFn.current?.();
    }, intervalMs);

    return () => {
      if (intervalRef.current !== undefined) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [executionId, intervalMs, poll]);

  const refetch = useCallback(() => {
    stoppedRef.current = false;
    consecutiveErrorsRef.current = 0;
    setConnectionLost(false);
    void poll();
  }, [poll]);

  return { execution, loading, error, connectionLost, refetch };
}
