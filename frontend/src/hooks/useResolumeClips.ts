/**
 * useResolumeClips Hook
 * 
 * Single Responsibility: Manage clip state for a specific layer
 * 
 * Design Patterns:
 * - Custom Hook for reusability
 * - Optimistic updates for better UX
 * - Automatic refetching on layer change
 * 
 * Performance:
 * - Memoizes clip array to prevent unnecessary re-renders
 * - Debounces refetch requests
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { resolumeApi } from '../services/ResolumeApiClient';
import { ClipViewModel, LayerIndex, ClipIndex } from '../types/resolume.types';

interface UseResolumeClipsOptions {
  layerIndex: LayerIndex;
  isConnected: boolean;
  autoRefreshInterval?: number; // milliseconds
}

interface UseResolumeClipsReturn {
  clips: ReadonlyArray<ClipViewModel>;
  activeClipId: number | null;
  activeClipIndex: ClipIndex | null;
  selectedClipIndex: number | null;
  isLoading: boolean;
  error: string | null;
  triggerClip: (clipIndex: ClipIndex) => Promise<void>;
  selectClip: (clipIndex: number | null) => void;
  clearLayer: () => Promise<void>;
  refetchClips: () => Promise<void>;
}

/**
 * Custom hook for managing clips in a layer
 */
export function useResolumeClips({
  layerIndex,
  isConnected,
  autoRefreshInterval = 3000,
}: UseResolumeClipsOptions): UseResolumeClipsReturn {
  const [clips, setClips] = useState<ReadonlyArray<ClipViewModel>>([]);
  const [activeClipId, setActiveClipId] = useState<number | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState<ClipIndex | null>(null);
  const [selectedClipIndex, setSelectedClipIndex] = useState<ClipIndex | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef<boolean>(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch clips for current layer
   */
  const fetchClips = useCallback(async () => {
    if (!isConnected) {
      setClips([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await resolumeApi.getClipsForLayer(layerIndex);
      
      if (!isMountedRef.current) return;

      const clipsData = response?.clips ?? [];
      setClips(clipsData);

      // Determine active clip (connected/playing state from Resolume)
      const activeClip = clipsData.find(clip => clip.isConnected);
      const activeIdx = clipsData.findIndex(clip => clip.isConnected);
      
      if (activeClip) {
        setActiveClipId(activeClip.id);
        setActiveClipIndex((activeIdx + 1) as ClipIndex);
        // Auto-select the playing clip
        setSelectedClipIndex((activeIdx + 1) as ClipIndex);
      } else {
        setActiveClipId(null);
        setActiveClipIndex(null);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      if (err?.statusCode === 404) {
        setClips([]);
        setError(`Layer ${layerIndex} not found in Resolume composition`);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clips';
      setError(errorMessage);
      console.error('Error fetching clips:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [layerIndex, isConnected]);

  /**
   * Select a clip (for scrubber display)
   */
  const selectClip = useCallback((clipIndex: number | null) => {
    setSelectedClipIndex(clipIndex as ClipIndex | null);
  }, []);

  /**
   * Trigger clip with optimistic update
   */
  const triggerClip = useCallback(async (clipIndex: ClipIndex) => {
    if (!isConnected) {
      throw new Error('Not connected to Resolume');
    }

    try {
      // Select and set as active immediately
      const targetClip = clips[clipIndex - 1];
      if (targetClip) {
        setActiveClipId(targetClip.id);
        setActiveClipIndex(clipIndex);
        setSelectedClipIndex(clipIndex);
      }

      // Make API call to trigger in Resolume
      await resolumeApi.triggerClip(layerIndex, clipIndex);

      // Refetch after delay to sync with Resolume
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchClips();
        }
      }, 500);
    } catch (err) {
      fetchClips();
      throw err;
    }
  }, [clips, layerIndex, isConnected, fetchClips]);

  /**
   * Clear layer (disconnect all clips)
   */
  const clearLayer = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Not connected to Resolume');
    }

    try {
      setActiveClipId(null);
      setActiveClipIndex(null);
      setSelectedClipIndex(null);

      await resolumeApi.clearLayer(layerIndex);

      setTimeout(() => {
        if (isMountedRef.current) {
          fetchClips();
        }
      }, 300);
    } catch (err) {
      fetchClips();
      throw err;
    }
  }, [layerIndex, isConnected, fetchClips]);

  /**
   * Setup effects for fetching and auto-refresh
   */
  useEffect(() => {
    isMountedRef.current = true;
    fetchClips();

    if (isConnected && autoRefreshInterval > 0) {
      refreshTimerRef.current = setInterval(fetchClips, autoRefreshInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchClips, isConnected, autoRefreshInterval]);

  // Reset selection when layer changes
  useEffect(() => {
    setSelectedClipIndex(null);
  }, [layerIndex]);

  const memoizedClips = useMemo(() => clips, [clips]);

  return {
    clips: memoizedClips,
    activeClipId,
    activeClipIndex,
    selectedClipIndex,
    isLoading,
    error,
    triggerClip,
    selectClip,
    clearLayer,
    refetchClips: fetchClips,
  };
}
export default useResolumeClips;
