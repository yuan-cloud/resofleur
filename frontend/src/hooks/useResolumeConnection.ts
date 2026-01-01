/**
 * useResolumeConnection Hook
 * 
 * Single Responsibility: Manage Resolume connection state
 * 
 * Design Pattern: Custom Hook for state encapsulation
 * Performance: Implements polling with exponential backoff
 * 
 * @returns Connection state and control methods
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { resolumeApi } from '../services/ResolumeApiClient';
import { ConnectionStatus } from '../types/resolume.types';

interface UseResolumeConnectionReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus | null;
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  retryConnection: () => void;
}

/**
 * Configuration for connection polling
 * Using exponential backoff for failed connections
 */
const POLLING_CONFIG = {
  INITIAL_INTERVAL: 2000,    // 2 seconds
  MAX_INTERVAL: 30000,       // 30 seconds
  BACKOFF_MULTIPLIER: 1.5,
  SUCCESS_INTERVAL: 5000,    // 5 seconds when connected
} as const;

export function useResolumeConnection(): UseResolumeConnectionReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid re-creating intervals on every render
  const pollingIntervalRef = useRef<number>(POLLING_CONFIG.INITIAL_INTERVAL);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Check connection status
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  const checkConnection = useCallback(async () => {
    try {
      const status = await resolumeApi.getConnectionStatus();
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      setConnectionStatus(status);
      setIsConnected(status.connected);
      setError(null);

      // Reset interval on successful connection
      if (status.connected) {
        pollingIntervalRef.current = POLLING_CONFIG.SUCCESS_INTERVAL;
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setIsConnected(false);

      // Exponential backoff on failure
      pollingIntervalRef.current = Math.min(
        pollingIntervalRef.current * POLLING_CONFIG.BACKOFF_MULTIPLIER,
        POLLING_CONFIG.MAX_INTERVAL
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Retry connection immediately
   * Resets backoff interval
   */
  const retryConnection = useCallback(() => {
    pollingIntervalRef.current = POLLING_CONFIG.INITIAL_INTERVAL;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    checkConnection();
  }, [checkConnection]);

  /**
   * Setup polling effect
   * Cleanup on unmount to prevent memory leaks
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Initial connection check
    checkConnection();

    // Setup recurring polling
    const scheduleNextCheck = () => {
      timeoutRef.current = setTimeout(() => {
        checkConnection().then(scheduleNextCheck);
      }, pollingIntervalRef.current);
    };

    scheduleNextCheck();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkConnection]);

  return {
    isConnected,
    connectionStatus,
    isLoading,
    error,
    checkConnection,
    retryConnection,
  };
}
export default useResolumeConnection;
