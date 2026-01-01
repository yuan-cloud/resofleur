/**
 * Type definitions for Resolume REST API v1
 * Based on official documentation: https://resolume.com/support/restapi
 * 
 * Design decisions:
 * - Using descriptive names over abbreviations
 * - Separating API types from UI types for flexibility
 * - Utilizing TypeScript utility types for DRY principle
 */

// ============================================================================
// Core Resolume Parameter Type (used throughout API)
// ============================================================================

export interface ResolumeParameter<TValue = unknown> {
  readonly id: number;
  readonly valuetype: 'ParamChoice' | 'ParamRange' | 'ParamString' | 'ParamBool' | 'ParamState' | 'ParamEvent';
  value: TValue;
  readonly index?: number;
  readonly min?: number;
  readonly max?: number;
  readonly options?: ReadonlyArray<string>;
}

// ============================================================================
// Clip Types
// ============================================================================

export type ClipConnectionState = 'Empty' | 'Disconnected' | 'Previewing' | 'Connected' | 'Connected & previewing';

export interface ResolumeClip {
  readonly id: number;
  name: ResolumeParameter<string>;
  connected: ResolumeParameter<ClipConnectionState>;
  selected: ResolumeParameter<boolean>;
  thumbnail: {
    readonly id: number;
    readonly last_update: string; // Used for cache busting
  };
  transport?: {
    position: ResolumeParameter<number>;
    controls?: Record<string, ResolumeParameter>;
  };
  video?: {
    opacity: ResolumeParameter<number>;
    resize?: ResolumeParameter<string>;
  };
  audio?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
}

// Simplified clip for UI consumption (denormalized for performance)
export interface ClipViewModel {
  readonly id: number;
  readonly name: string;
  readonly isConnected: boolean;
  readonly thumbnailUrl: string;
  readonly opacityParameterId?: number;
  readonly positionParameterId?: number;
}

// ============================================================================
// Layer Types
// ============================================================================

export interface ResolumeLayer {
  readonly id: number;
  name: ResolumeParameter<string>;
  clips: ReadonlyArray<ResolumeClip>;
  selected: ResolumeParameter<boolean>;
  bypassed: ResolumeParameter<boolean>;
  solo: ResolumeParameter<boolean>;
  master: ResolumeParameter<number>;
  video?: Record<string, unknown>;
  audio?: Record<string, unknown>;
}

// ============================================================================
// Composition Types
// ============================================================================

export interface ResolumeComposition {
  name: ResolumeParameter<string>;
  layers: ReadonlyArray<ResolumeLayer>;
  columns: ReadonlyArray<unknown>;
  tempocontroller: {
    tempo: ResolumeParameter<number>;
  };
  dashboard?: Record<string, unknown>;
  crossfader?: Record<string, unknown>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ResolumeConfiguration {
  readonly id: string;
  name: string;
  host: string;
  port: number;
  is_active: boolean;
  created_at: string;
}

export type ConfigurationPreset = 'local' | 'network' | 'cloud';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<TData = unknown> {
  data?: TData;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  config?: ResolumeConfiguration;
  composition_name?: string;
  error?: string;
}

export interface ClipsResponse {
  clips: ReadonlyArray<ClipViewModel>;
}

export interface ConfigurationsResponse {
  configurations: ReadonlyArray<ResolumeConfiguration>;
}

// ============================================================================
// Error Types
// ============================================================================

export class ResolumeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = 'ResolumeApiError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type LayerIndex = 1 | 2 | 3 | 4;
export type ClipIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
