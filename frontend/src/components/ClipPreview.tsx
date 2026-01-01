/**
 * ClipPreview Component
 * 
 * Live-refreshing thumbnail preview of the playing clip
 * Updates every 500ms to show "flipbook" style video preview
 */

import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

interface ClipPreviewProps {
  layerIndex: number;
  clipIndex: number;
  clipName: string;
  isPlaying: boolean;
  scrubPosition: number;
}

export default function ClipPreview({ 
  layerIndex, 
  clipIndex, 
  clipName, 
  isPlaying,
  scrubPosition 
}: ClipPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const frameCount = useRef(0);

  // Generate thumbnail URL with cache-busting
  const getThumbnailUrl = () => {
    return `${API_URL}/api/resolume/composition/layers/${layerIndex}/clips/${clipIndex}/thumbnail?t=${Date.now()}`;
  };

  // Refresh thumbnail
  const refreshThumbnail = () => {
    const newUrl = getThumbnailUrl();
    
    // Preload image to avoid flicker
    const img = new Image();
    img.onload = () => {
      setImageUrl(newUrl);
      setIsLoading(false);
      setError(false);
      frameCount.current++;
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    img.src = newUrl;
  };

  // Start/stop refresh based on playing state
  useEffect(() => {
    // Initial load
    refreshThumbnail();

    // If playing, refresh rapidly for "video" effect
    if (isPlaying) {
      refreshInterval.current = setInterval(refreshThumbnail, 500); // 2 FPS when playing
    } else {
      // Slower refresh when not playing
      refreshInterval.current = setInterval(refreshThumbnail, 2000);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [layerIndex, clipIndex, isPlaying]);

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video shadow-2xl">
      {/* Video preview */}
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={clipName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {error ? (
            <p className="text-gray-500 text-sm">Preview unavailable</p>
          ) : (
            <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
      
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
        <span className="text-white/80 text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
          Layer {layerIndex}
        </span>
        {isPlaying && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-rose-500/90 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-medium text-sm truncate mb-2">{clipName}</p>
        
        {/* Mini progress bar */}
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-400 to-pink-400 transition-all duration-300"
            style={{ width: `${scrubPosition * 100}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/60 text-[10px]">
            {isPlaying ? 'Refreshing preview...' : 'Static preview'}
          </span>
          <span className="text-white/60 text-[10px] tabular-nums">
            {Math.round(scrubPosition * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
