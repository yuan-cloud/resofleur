/**
 * ResolumeControls
 * Premium, minimal control interface - Mobile Optimized
 */

import React from 'react';
import { ClipViewModel, LayerIndex } from '../types/resolume.types';
import VideoScrubber from './VideoScrubber';
import ClipPreview from './ClipPreview';

export interface ResolumeControlsProps {
  selectedLayer: LayerIndex;
  onLayerChange: (layer: LayerIndex) => void;
  clips: ReadonlyArray<ClipViewModel>;
  activeClipId: number | null;
  selectedClipIndex: number | null;
  onTriggerClip: (clipIndex: number) => void;
  onSelectClip: (clipIndex: number | null) => void;
  onClearLayer: () => void;
  bpm: number;
  onBpmChange: (value: number) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  scrubPosition: number;
  onScrubChange: (value: number) => void;
  connected: boolean;
  loading: boolean;
}

export default function ResolumeControls({
  selectedLayer,
  onLayerChange,
  clips,
  activeClipId,
  selectedClipIndex,
  onTriggerClip,
  onSelectClip,
  onClearLayer,
  bpm,
  onBpmChange,
  opacity,
  onOpacityChange,
  scrubPosition,
  onScrubChange,
  connected,
  loading,
}: ResolumeControlsProps) {
  
  // Ensure clips is always an array
  const safeClips = clips ?? [];
  
  // Get selected clip info
  const selectedClip = selectedClipIndex && safeClips.length > 0 ? safeClips[selectedClipIndex - 1] : null;
  const hasSelectedClip = selectedClip && selectedClip.name;
  
  return (
    <div className="space-y-6 md:space-y-10">
      
      {/* Layer Selection - scrollable on mobile */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:overflow-visible">
        {([1, 2, 3, 4] as LayerIndex[]).map((layer) => (
          <button
            key={layer}
            onClick={() => onLayerChange(layer)}
            className={`flex-1 min-w-[70px] py-3 md:py-3.5 rounded-xl md:rounded-2xl text-sm font-semibold transition-all duration-300 ${
              selectedLayer === layer
                ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-lg shadow-rose-200/50'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:shadow-md border border-gray-200/80'
            }`}
          >
            <span className="hidden sm:inline">Layer </span>{layer}
          </button>
        ))}
      </div>

      {/* Clip Grid - 3 cols on mobile, stays 3 on desktop */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((clipIndex) => {
          const clip = safeClips[clipIndex - 1];
          const hasContent = clip && clip.name;
          const isPlaying = clip?.isConnected;
          const isSelected = selectedClipIndex === clipIndex;
          
          return (
            <button
              key={clipIndex}
              onClick={() => {
                onTriggerClip(clipIndex);
                onSelectClip(clipIndex);
              }}
              disabled={!connected}
              className={`group relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 touch-manipulation ${
                isPlaying
                  ? 'ring-2 ring-rose-400 ring-offset-2 md:ring-offset-4 ring-offset-white/80 scale-[1.02]'
                  : isSelected
                    ? 'ring-2 ring-rose-200 ring-offset-1 md:ring-offset-2 ring-offset-white/80'
                    : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-200/50 active:scale-[0.98]'
              } ${!connected ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {/* Background */}
              {hasContent ? (
                <>
                  {/* Thumbnail */}
                  {clip.thumbnailUrl && (
                    <img 
                      src={clip.thumbnailUrl} 
                      alt={clip.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  {/* Elegant dark overlay */}
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-gradient-to-br from-rose-600/80 via-pink-600/80 to-rose-700/90'
                      : 'bg-gradient-to-br from-gray-600/90 via-gray-700/90 to-gray-800/95'
                  }`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-800/50 to-transparent" />
                </>
              ) : (
                /* Empty state - minimal */
                <div className="absolute inset-0 border-2 border-dashed border-gray-200/60 rounded-xl md:rounded-2xl" />
              )}
              
              {/* Content overlay */}
              <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] sm:text-xs font-medium ${hasContent ? 'text-white/70' : 'text-gray-400'}`}>
                    {clipIndex}
                  </span>
                  {isPlaying && (
                    <div className="flex items-center gap-1">
                      <span className="hidden sm:block text-[10px] text-white/80 font-medium uppercase tracking-wider">Playing</span>
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
                    </div>
                  )}
                  {isSelected && !isPlaying && hasContent && (
                    <span className="hidden sm:block text-[10px] text-white/60 font-medium uppercase tracking-wider">Selected</span>
                  )}
                </div>
                {hasContent && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-white font-medium truncate">
                    {clip.name}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Preview + Timeline Scrubber */}
      {hasSelectedClip && connected && (
        <div className="space-y-3 md:space-y-4">
          {/* Video Preview */}
          <ClipPreview
            layerIndex={selectedLayer}
            clipIndex={selectedClipIndex!}
            clipName={selectedClip?.name || ''}
            isPlaying={selectedClip?.isConnected || false}
            scrubPosition={scrubPosition}
          />
          
          {/* Scrubber Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
              <span>Timeline</span>
              {selectedClip?.isConnected ? (
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">Playing - </span>drag to scrub
                </span>
              ) : (
                <span className="text-amber-500 text-[10px] sm:text-xs">Start clip to scrub</span>
              )}
            </div>
            <VideoScrubber 
              scrubPosition={scrubPosition} 
              onScrub={onScrubChange}
              disabled={!selectedClip?.isConnected}
            />
          </div>
        </div>
      )}

      {/* Dual Controls - Stack on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Opacity */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs sm:text-sm text-gray-500">Opacity</span>
            <span className="text-lg sm:text-xl font-semibold text-gray-800 tabular-nums">{opacity}%</span>
          </div>
          <input
            type="range"
            className="slider w-full h-2 touch-manipulation"
            defaultValue={100}
            min="0"
            max="100"
            onInput={(e) => {
              const newValue = Number((e.target as HTMLInputElement).value);
              onOpacityChange(newValue);
            }}
          />
        </div>

        {/* Tempo */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs sm:text-sm text-gray-500">Tempo</span>
            <span className="text-lg sm:text-xl font-semibold text-gray-800 tabular-nums">{bpm} <span className="text-xs sm:text-sm font-normal text-gray-400">BPM</span></span>
          </div>
          <input
            type="range"
            className="slider w-full h-2 touch-manipulation"
            defaultValue={120}
            min="20"
            max="200"
            onInput={(e) => {
              const newValue = Number((e.target as HTMLInputElement).value);
              onBpmChange(newValue);
            }}
          />
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={() => {
          onClearLayer();
          onSelectClip(null);
        }}
        disabled={!connected || loading}
        className="w-full py-3 md:py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-xl text-sm font-medium transition-all disabled:opacity-30 touch-manipulation"
      >
        Clear Layer
      </button>
    </div>
  );
}
