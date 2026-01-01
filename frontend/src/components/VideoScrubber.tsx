/**
 * VideoScrubber Component
 * 
 * Interactive scrubber for video position control
 * Supports click and drag
 */

import React, { useRef, useState, useCallback } from 'react';

export interface VideoScrubberProps {
  scrubPosition: number; // 0-1
  onScrub: (position: number) => void;
  disabled?: boolean;
}

export default function VideoScrubber({ scrubPosition, onScrub, disabled = false }: VideoScrubberProps) {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(scrubPosition);

  const calculatePosition = useCallback((clientX: number): number => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position));
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    const position = calculatePosition(e.clientX);
    setLocalPosition(position);
    onScrub(position);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;
    const position = calculatePosition(e.clientX);
    setLocalPosition(position);
    onScrub(position);
  }, [isDragging, disabled, calculatePosition, onScrub]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update local position when prop changes (from server sync)
  React.useEffect(() => {
    if (!isDragging) {
      setLocalPosition(scrubPosition);
    }
  }, [scrubPosition, isDragging]);

  const displayPosition = isDragging ? localPosition : scrubPosition;

  return (
    <div className={`space-y-3 p-4 bg-gray-50/80 backdrop-blur rounded-xl ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Timeline</span>
        <span className="text-sm font-semibold text-gray-800 tabular-nums">
          {Math.round(displayPosition * 100)}%
        </span>
      </div>
      <div
        ref={scrubberRef}
        onMouseDown={handleMouseDown}
        className={`relative h-3 bg-gray-200 rounded-full overflow-hidden group ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Track background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200" />
        
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-400 to-pink-400 transition-[width] duration-75 rounded-full"
          style={{ width: `${displayPosition * 100}%` }}
        />
        
        {/* Playhead */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-rose-400 transition-opacity ${
            isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ left: `calc(${displayPosition * 100}% - 10px)` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">
        {isDragging ? 'Release to set position' : 'Click or drag to scrub'}
      </p>
    </div>
  );
}
