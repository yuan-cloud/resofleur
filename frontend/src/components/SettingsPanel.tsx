/**
 * SettingsPanel Component
 * 
 * Configuration management for Resolume connections
 * Supports local, network, and ngrok setups
 */

import React, { useState, useEffect, useCallback } from 'react';
import { resolumeApi } from '../services/ResolumeApiClient';
import { ResolumeConfiguration, ConfigurationPreset } from '../types/resolume.types';

export interface SettingsPanelProps {
  hasActiveConfig: boolean;
  onClose: () => void;
}

interface NewConfigForm {
  name: string;
  host: string;
  port: number;
}

export default function SettingsPanel({ 
  hasActiveConfig,
  onClose,
}: SettingsPanelProps) {
  const [setupType, setSetupType] = useState<ConfigurationPreset | ''>('');
  const [configs, setConfigs] = useState<ReadonlyArray<ResolumeConfiguration>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [newConfig, setNewConfig] = useState<NewConfigForm>({
    name: '',
    host: '',
    port: 8080,
  });

  /**
   * Fetch all configurations on mount
   */
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedConfigs = await resolumeApi.getConfigurations();
      setConfigs(fetchedConfigs);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch configurations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle preset button clicks
   */
  const handlePresetClick = (type: ConfigurationPreset) => {
    setSetupType(type);
    
    if (type === 'local') {
      setNewConfig({ 
        ...newConfig, 
        host: '127.0.0.1', 
        port: 8080,
        name: newConfig.name || 'Local Resolume'
      });
    } else if (type === 'network') {
      setNewConfig({ 
        ...newConfig, 
        host: '', 
        port: 8080,
        name: newConfig.name || 'Network Resolume'
      });
    } else if (type === 'cloud') {
      setNewConfig({ 
        ...newConfig, 
        host: '', 
        port: 443,
        name: newConfig.name || 'Remote Resolume (Ngrok)'
      });
    }
  };

  /**
   * Get contextual help text based on setup type
   */
  const getHelpText = (): string => {
    if (setupType === 'local') {
      return '✅ Use 127.0.0.1 when Resolume is on THIS computer';
    } else if (setupType === 'network') {
      return '🌐 Enter the IP shown in Resolume preferences (e.g., 192.168.1.151)';
    } else if (setupType === 'cloud') {
      return '☁️ Enter your ngrok URL without https:// (e.g., abc123.ngrok-free.dev)';
    }
    return 'Choose a setup type above to get started';
  };

  /**
   * Create new configuration
   */
  const handleCreateConfig = async () => {
    if (!newConfig.name || !newConfig.host) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      await resolumeApi.createConfiguration(newConfig);
      
      // Show success message
      setSuccessMessage(`✅ "${newConfig.name}" saved and activated!`);
      
      // Reset form
      setNewConfig({ name: '', host: '', port: 8080 });
      setSetupType('');
      
      // Refresh configs immediately
      await fetchConfigs();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create configuration';
      setError(errorMessage);
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Activate or delete configuration
   */
  const handleConfigAction = async (configId: string, shouldDelete: boolean = false) => {
    try {
      setIsLoading(true);
      
      if (shouldDelete) {
        await resolumeApi.deleteConfiguration(configId);
      } else {
        await resolumeApi.activateConfiguration(configId);
        // Close settings panel after activation
        setTimeout(onClose, 500);
      }
      
      await fetchConfigs();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white/50 rounded-xl sm:rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Resolume Setup</h3>
        {hasActiveConfig && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm touch-manipulation"
          >
            ✕ Close
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-[10px] sm:text-xs">
          ⚠️ {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-2 sm:p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-[10px] sm:text-xs animate-pulse">
          {successMessage}
        </div>
      )}
      
      <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
        Connect to your Resolume Arena or Avenue software
      </p>

      {/* Setup Type Selector - stack on small mobile */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-2">
          Where is Resolume running?
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            onClick={() => handlePresetClick('local')}
            className={`p-2 sm:p-3 rounded-lg border-2 text-[10px] sm:text-xs font-medium transition-all touch-manipulation ${
              setupType === 'local'
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
            }`}
          >
            <div className="text-base sm:text-lg mb-0.5 sm:mb-1">💻</div>
            <span className="hidden sm:inline">This Computer</span>
            <span className="sm:hidden">Local</span>
          </button>
          <button
            onClick={() => handlePresetClick('network')}
            className={`p-2 sm:p-3 rounded-lg border-2 text-[10px] sm:text-xs font-medium transition-all touch-manipulation ${
              setupType === 'network'
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
            }`}
          >
            <div className="text-base sm:text-lg mb-0.5 sm:mb-1">🏠</div>
            <span className="hidden sm:inline">Same Network</span>
            <span className="sm:hidden">Network</span>
          </button>
          <button
            onClick={() => handlePresetClick('cloud')}
            className={`p-2 sm:p-3 rounded-lg border-2 text-[10px] sm:text-xs font-medium transition-all touch-manipulation ${
              setupType === 'cloud'
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
            }`}
          >
            <div className="text-base sm:text-lg mb-0.5 sm:mb-1">☁️</div>
            <span className="hidden sm:inline">Cloud (Ngrok)</span>
            <span className="sm:hidden">Cloud</span>
          </button>
        </div>
        <div className={`mt-2 p-2 rounded-lg text-[10px] sm:text-xs ${
          setupType ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
        }`}>
          {getHelpText()}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="text-left space-y-2 sm:space-y-3">
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
            Config Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., My Laptop"
            value={newConfig.name}
            onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-violet-400 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
            Host / IP Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={
              setupType === 'local' ? '127.0.0.1' :
              setupType === 'network' ? 'e.g., 192.168.1.151' :
              setupType === 'cloud' ? 'e.g., abc123.ngrok-free.dev' :
              'Select setup type above'
            }
            value={newConfig.host}
            onChange={(e) => setNewConfig({ ...newConfig, host: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-violet-400 text-sm"
          />
          {setupType === 'network' && (
            <p className="text-[10px] sm:text-xs text-amber-600 mt-1 flex items-start gap-1">
              <span>💡</span>
              <span>Find this IP in Resolume → Preferences → Webserver</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Port <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="8080"
            value={newConfig.port}
            onChange={(e) => setNewConfig({ ...newConfig, port: parseInt(e.target.value) || 8080 })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-violet-400 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {setupType === 'cloud' ? 'Use 443 for ngrok HTTPS' : 'Default is 8080'}
          </p>
        </div>
        <button
          onClick={handleCreateConfig}
          disabled={!newConfig.name || !newConfig.host || !setupType || isSaving}
          className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>💾 Save & Start Controlling</>
          )}
        </button>
      </div>

      {/* Saved Configurations List */}
      {configs.length > 0 && (
        <div className="pt-4 border-t border-gray-300">
          <p className="text-xs font-semibold text-gray-700 mb-3">Saved Configurations:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {configs.map((config) => (
              <div 
                key={config.id} 
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  config.is_active 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-white border-gray-200 hover:border-violet-300'
                }`}
              >
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {config.name}
                    </p>
                    {config.is_active && (
                      <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {config.host}:{config.port}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!config.is_active && (
                    <button
                      onClick={() => handleConfigAction(config.id, false)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-violet-500 text-white rounded text-xs font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
                      title="Activate this configuration"
                    >
                      Use
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (config.is_active) {
                        if (window.confirm('This configuration is currently active. Delete anyway?')) {
                          handleConfigAction(config.id, true);
                        }
                      } else {
                        handleConfigAction(config.id, true);
                      }
                    }}
                    disabled={isLoading}
                    className="px-2 py-1.5 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="Delete this configuration"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
