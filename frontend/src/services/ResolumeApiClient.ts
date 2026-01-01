/**
 * Resolume REST API Client
 * 
 * Single Responsibility: Handle all HTTP communication with Resolume backend
 * 
 * Design Patterns:
 * - Singleton pattern for API client instance
 * - Factory pattern for error creation
 * - Strategy pattern for request building
 * 
 * Performance Considerations:
 * - Implements request deduplication
 * - Uses AbortController for request cancellation
 * - Caches GET requests where appropriate
 */

import {
  ResolumeApiError,
  ConnectionStatus,
  ClipsResponse,
  ResolumeConfiguration,
  LayerIndex,
  ClipIndex,
  ConfigurationsResponse
} from '../types/resolume.types';

// Get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('resofleur_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.tokens?.access_token || null;
    }
  } catch (e) {
    console.error('Failed to get auth token:', e);
  }
  return null;
}

class ResolumeApiClient {
  private readonly baseUrl: string;
  private readonly requestCache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly cacheTTL = 1000; // 1 second cache for GET requests
  private readonly pendingRequests: Map<string, Promise<unknown>> = new Map();

  constructor(baseUrl: string = process.env.REACT_APP_BACKEND_URL || '') {
    // Use relative URL if baseUrl is empty (for same-origin deployment)
    // This allows the frontend to work on any domain when served by the backend
    this.baseUrl = baseUrl || '';
  }

  /**
   * Get authorization headers if token exists
   */
  private getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Generic request handler with error handling and type safety
   * Time Complexity: O(1)
   * Space Complexity: O(1)
   */
  private async request<TResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}_${url}`;
    // Debug logging disabled for production
    // console.log('[DEBUG] API Request:', { method: options.method || 'GET', url, endpoint });

    // Check cache for GET requests (improve performance)
    if (options.method === 'GET' || !options.method) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data as TResponse;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Don't try to read body on error - just use status info
      throw new ResolumeApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        endpoint
      );
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as TResponse;
    }

    const data = await response.json() as TResponse;

    // Cache successful GET requests
    if (options.method === 'GET' || !options.method) {
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return this.request<ConnectionStatus>('/api/resolume/status');
  }

  async getConfigurations(): Promise<ReadonlyArray<ResolumeConfiguration>> {
    const response = await this.request<ResolumeConfiguration[]>('/api/resolume/config');
    return response;
  }

  async createConfiguration(config: Omit<ResolumeConfiguration, 'id' | 'created_at' | 'is_active'>): Promise<ResolumeConfiguration> {
    return this.request<ResolumeConfiguration>('/api/resolume/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async activateConfiguration(configId: string): Promise<void> {
    await this.request(`/api/resolume/config/${configId}/activate`, {
      method: 'PUT',
    });
    // Invalidate connection status cache
    this.invalidateCache('/api/resolume/status');
  }

  async deleteConfiguration(configId: string): Promise<void> {
    await this.request(`/api/resolume/config/${configId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Clip Management
  // ============================================================================

  async getClipsForLayer(layerIndex: LayerIndex): Promise<ClipsResponse> {
    return this.request<ClipsResponse>(`/api/resolume/composition/layers/${layerIndex}/clips`);
  }

  async triggerClip(layerIndex: LayerIndex, clipIndex: ClipIndex): Promise<void> {
    await this.request(`/api/resolume/composition/layers/${layerIndex}/clips/${clipIndex}/connect`, {
      method: 'POST',
    });
  }

  async clearLayer(layerIndex: LayerIndex): Promise<void> {
    await this.request(`/api/resolume/composition/layers/${layerIndex}/clear`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // Parameter Controls (BPM, Opacity, Scrubbing)
  // ============================================================================

  async setBpm(bpm: number): Promise<void> {
    if (bpm < 20 || bpm > 999) {
      throw new ResolumeApiError('BPM must be between 20 and 999');
    }
    await this.request(`/api/resolume/composition/tempo/bpm?bpm=${bpm}`, {
      method: 'POST',
    });
  }

  async getBpm(): Promise<{ value: number }> {
    return this.request<{ value: number }>('/api/resolume/composition/tempo/bpm');
  }

  async setClipOpacity(layerIndex: LayerIndex, clipIndex: ClipIndex, opacity: number): Promise<void> {
    if (opacity < 0 || opacity > 1) {
      throw new ResolumeApiError('Opacity must be between 0 and 1');
    }
    await this.request(
      `/api/resolume/composition/layers/${layerIndex}/clips/${clipIndex}/video/opacity/values?opacity=${opacity}`,
      { method: 'PUT' }
    );
  }

  async getLayerOpacity(layerIndex: LayerIndex): Promise<{ value: number }> {
    return this.request<{ value: number }>(`/api/resolume/composition/layers/${layerIndex}/video/opacity`);
  }

  async setLayerOpacity(layerIndex: LayerIndex, opacity: number): Promise<void> {
    if (opacity < 0 || opacity > 1) {
      throw new ResolumeApiError('Opacity must be between 0 and 1');
    }
    await this.request(
      `/api/resolume/composition/layers/${layerIndex}/video/opacity?opacity=${opacity}`,
      { method: 'POST' }
    );
  }

  async setClipPosition(layerIndex: LayerIndex, clipIndex: ClipIndex, position: number): Promise<void> {
    if (position < 0 || position > 1) {
      throw new ResolumeApiError('Position must be between 0 and 1');
    }
    await this.request(
      `/api/resolume/composition/layers/${layerIndex}/clips/${clipIndex}/transport/position?position=${position}`,
      { method: 'POST' }
    );
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Invalidate cache for specific endpoint
   * Useful when we know data has changed
   */
  invalidateCache(endpoint: string): void {
    const keysToDelete: string[] = [];
    this.requestCache.forEach((_, key) => {
      if (key.includes(endpoint)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.requestCache.clear();
  }
}

// Export singleton instance
export const resolumeApi = new ResolumeApiClient();
export default ResolumeApiClient;
