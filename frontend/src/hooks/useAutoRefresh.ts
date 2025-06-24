import { useEffect, useRef, useState, useCallback } from 'react';
import { DevicesAPI } from '../services/api';

interface AutoRefreshConfig {
  enabled: boolean;
  intervalMinutes: number;
  refreshOnlineDevices: boolean;
  forceConnectionOfflineDevices: boolean;
}

interface AutoRefreshStatus {
  isRunning: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  refreshCount: number;
  lastResult: any;
  errors: string[];
}

const DEFAULT_CONFIG: AutoRefreshConfig = {
  enabled: true,
  intervalMinutes: 10,
  refreshOnlineDevices: true,
  forceConnectionOfflineDevices: true,
};

export const useAutoRefresh = (config: Partial<AutoRefreshConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<AutoRefreshStatus>({
    isRunning: false,
    lastRefresh: null,
    nextRefresh: null,
    refreshCount: 0,
    lastResult: null,
    errors: [],
  });

  const updateNextRefresh = useCallback(() => {
    if (finalConfig.enabled) {
      const next = new Date();
      next.setMinutes(next.getMinutes() + finalConfig.intervalMinutes);
      setStatus(prev => ({ ...prev, nextRefresh: next }));
    }
  }, [finalConfig.enabled, finalConfig.intervalMinutes]);

  const performRefresh = useCallback(async () => {
    console.log('🔄 Starting automatic device refresh...');
    
    setStatus(prev => ({ 
      ...prev, 
      isRunning: true, 
      lastRefresh: new Date(),
      errors: []
    }));

    try {
      const results: any = {};
      const errors: string[] = [];
      
      // Refresh all devices information
      if (finalConfig.refreshOnlineDevices) {
        console.log('📡 Refreshing all devices information...');
        try {
          const refreshResult = await DevicesAPI.refreshAllDevices();
          results.refreshAll = refreshResult.data;
          console.log('✅ Device refresh completed:', refreshResult.data);
        } catch (error) {
          const errorMsg = `Falha ao atualizar dispositivos: ${error instanceof Error ? error.message : error}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
          results.refreshAll = { error: errorMsg };
        }
      }

      // Force connection for offline devices
      if (finalConfig.forceConnectionOfflineDevices) {
        console.log('🔌 Forcing connection for offline devices...');
        try {
          const connectionResult = await DevicesAPI.forceConnectionAllOffline();
          results.forceConnection = connectionResult.data;
          console.log('✅ Connection requests completed:', connectionResult.data);
        } catch (error) {
          const errorMsg = `Falha ao forçar conexões: ${error instanceof Error ? error.message : error}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
          results.forceConnection = { error: errorMsg };
        }
      }

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        refreshCount: prev.refreshCount + 1,
        lastResult: results,
        errors: errors
      }));
      
      updateNextRefresh();
      
      // Emit event to notify components that auto-refresh completed
      window.dispatchEvent(new CustomEvent('autoRefreshCompleted', { 
        detail: { results, timestamp: new Date(), errors }
      }));
      
      console.log('✅ Automatic device refresh completed successfully');
      
    } catch (error) {
      const errorMsg = `Auto refresh failed: ${error instanceof Error ? error.message : error}`;
      console.error('❌ Auto refresh error:', error);
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        errors: [errorMsg]
      }));

      updateNextRefresh();
      
      // Emit error event
      window.dispatchEvent(new CustomEvent('autoRefreshError', {
        detail: { error: errorMsg }
      }));
    }
  }, [finalConfig.refreshOnlineDevices, finalConfig.forceConnectionOfflineDevices, updateNextRefresh]);
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (finalConfig.enabled) {
      console.log(`🚀 Starting auto refresh every ${finalConfig.intervalMinutes} minutes`);
      
      // Set up interval first
      intervalRef.current = setInterval(
        performRefresh,
        finalConfig.intervalMinutes * 60 * 1000
      );

      // Perform initial refresh after a small delay to allow UI to update
      setTimeout(() => {
        performRefresh();
      }, 1000);

      setStatus(prev => ({ ...prev, isRunning: false }));
    }
  }, [finalConfig.enabled, finalConfig.intervalMinutes, performRefresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      console.log('🛑 Stopping auto refresh');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus(prev => ({ 
      ...prev, 
      isRunning: false, 
      nextRefresh: null 
    }));
  }, []);

  const manualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await performRefresh();
  }, [performRefresh]);

  // Start/stop auto refresh when config changes
  useEffect(() => {
    if (finalConfig.enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [finalConfig.enabled, startAutoRefresh, stopAutoRefresh]);

  return {
    status,
    config: finalConfig,
    startAutoRefresh,
    stopAutoRefresh,
    manualRefresh,
    isEnabled: finalConfig.enabled,
    isRunning: status.isRunning,
  };
};

export default useAutoRefresh;
