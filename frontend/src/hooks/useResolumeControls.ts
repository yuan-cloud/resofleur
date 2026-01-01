/**
 * useResolumeControls Hook
 * 
 * Single Responsibility: Manage Resolume parameter controls (BPM, Opacity, Scrubbing)
 * 
 * Design Patterns:
 * - Custom Hook for state management
 * - Debouncing for performance (avoid spamming API)
 * - Optimistic updates for instant UI feedback
 * 
 * Performance Optimization:
 * - Debounces rapid slider movements
 * - Uses refs to avoid re-renders during updates
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { resolumeApi } from '../services/ResolumeApiClient';
import { LayerIndex, ClipIndex } from '../types/resolume.types';

interface UseResolumeControlsOptions {
  layerIndex: LayerIndex;
  activeClipId: number | null;
  activeClipIndex: number | null;
  isConnected: boolean;
}

interface UseResolumeControlsReturn {
  // BPM Control
  bpm: number;
  setBpm: (value: number) => void;
  isBpmLoading: boolean;
  
  // Opacity Control
  opacity: number;
  setOpacity: (value: number) => void;
  isOpacityLoading: boolean;
  
  // Scrubbing Control
  scrubPosition: number;
  setScrubPosition: (value: number) => void;
  isScrubbing: boolean;
  
  // Error state
  error: string | null;
}

/**
 * Debounce delay for slider controls (milliseconds)
 * Prevents API spam during rapid slider movement
 */
const DEBOUNCE_DELAY = 150;

/**
 * Custom hook for managing Resolume parameter controls
 * 
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1)
 */
export function useResolumeControls({
  layerIndex,
  activeClipId,
  activeClipIndex,
  isConnected,
}: UseResolumeControlsOptions): UseResolumeControlsReturn {
  // State
  const [bpm, setBpmState] = useState<number>(120);
  const [opacity, setOpacityState] = useState<number>(100);
  const [scrubPosition, setScrubPositionState] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isBpmLoading, setIsBpmLoading] = useState<boolean>(false);
  const [isOpacityLoading, setIsOpacityLoading] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Refs for debouncing (avoid stale closures)
  const bpmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const opacityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrubTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Fetch initial BPM and Opacity from Resolume
   * Runs when connected and when layer changes
   */
  useEffect(() => {
    const fetchInitialValues = async () => {
      if (!isConnected) return;

      // Fetch BPM (global, not layer-specific)
      try {
        const bpmResponse = await resolumeApi.getBpm();
        if (isMountedRef.current) {
          setBpmState(Math.round(bpmResponse.value));
        }
      } catch (err) {
        console.error('Failed to fetch BPM:', err);
      }

      // Fetch layer opacity (may fail if layer doesn't exist)
      try {
        const opacityResponse = await resolumeApi.getLayerOpacity(layerIndex);
        if (isMountedRef.current) {
          // Convert 0-1 to 0-100 for UI
          setOpacityState(Math.round(opacityResponse.value * 100));
        }
      } catch (err: any) {
        // Silently handle 404 - layer doesn't exist
        if (err?.statusCode !== 404) {
          console.error('Failed to fetch layer opacity:', err);
        }
        // Reset opacity to default for missing layers
        if (isMountedRef.current) {
          setOpacityState(100);
        }
      }
    };

    fetchInitialValues();
  }, [isConnected, layerIndex]);

  /**
   * Set BPM with debouncing and optimistic update
   * 
   * Pattern: Optimistic UI + Debounced API call
   * - Updates UI immediately for responsive feel
   * - Debounces API call to prevent spam
   */
  const setBpm = useCallback((value: number) => {
    console.log('[HOOK] setBpm:', value);
    
    // Optimistic update: change UI immediately
    setBpmState(value);
    setError(null);

    // Clear existing timeout
    if (bpmTimeoutRef.current) {
      clearTimeout(bpmTimeoutRef.current);
    }

    // Debounce API call
    bpmTimeoutRef.current = setTimeout(async () => {
      try {
        setIsBpmLoading(true);
        await resolumeApi.setBpm(value);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set BPM';
        setError(errorMessage);
        console.error('BPM update error:', err);
      } finally {
        if (isMountedRef.current) {
          setIsBpmLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);
  }, []);

  /**
   * Set layer opacity with debouncing and optimistic update
   * 
   * Note: Controls the layer opacity, not individual clips
   * Opacity value: 0-100 (UI) → 0-1 (API)
   */
  const setOpacity = useCallback((value: number) => {
    console.log('[HOOK] setOpacity:', value);
    
    // Optimistic update
    setOpacityState(value);
    setError(null);

    // Clear existing timeout
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
    }

    // Debounce API call
    opacityTimeoutRef.current = setTimeout(async () => {
      try {
        setIsOpacityLoading(true);
        
        // Convert 0-100 to 0-1 for API
        const normalizedOpacity = value / 100;
        
        // Set layer opacity (not clip opacity)
        await resolumeApi.setLayerOpacity(layerIndex, normalizedOpacity);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set opacity';
        setError(errorMessage);
        console.error('Opacity update error:', err);
      } finally {
        if (isMountedRef.current) {
          setIsOpacityLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);
  }, [layerIndex]);

  /**
   * Set scrub position with debouncing and optimistic update
   * 
   * Note: Only works when a clip is active and playing
   * Position value: 0-1 (normalized)
   */
  const setScrubPosition = useCallback((value: number) => {
    if (!isConnected || !activeClipId || !activeClipIndex) return;

    // Optimistic update
    setScrubPositionState(value);
    setError(null);

    // Clear existing timeout
    if (scrubTimeoutRef.current) {
      clearTimeout(scrubTimeoutRef.current);
    }

    // Debounce API call
    scrubTimeoutRef.current = setTimeout(async () => {
      try {
        setIsScrubbing(true);
        
        await resolumeApi.setClipPosition(layerIndex, activeClipIndex as ClipIndex, value);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to scrub clip';
        setError(errorMessage);
        console.error('Scrub error:', err);
      } finally {
        if (isMountedRef.current) {
          setIsScrubbing(false);
        }
      }
    }, DEBOUNCE_DELAY);
  }, [isConnected, activeClipId, activeClipIndex, layerIndex]);

  /**
   * Cleanup on unmount
   * Clear all pending timeouts to prevent memory leaks
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (bpmTimeoutRef.current) clearTimeout(bpmTimeoutRef.current);
      if (opacityTimeoutRef.current) clearTimeout(opacityTimeoutRef.current);
      if (scrubTimeoutRef.current) clearTimeout(scrubTimeoutRef.current);
    };
  }, []);

  return {
    bpm,
    setBpm,
    isBpmLoading,
    opacity,
    setOpacity,
    isOpacityLoading,
    scrubPosition,
    setScrubPosition,
    isScrubbing,
    error,
  };
}
export default useResolumeControls;
