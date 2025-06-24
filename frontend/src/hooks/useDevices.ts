import { useState, useEffect, useCallback } from 'react';
import { DevicesAPI } from '../services/api';

interface Device {
  _id: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  status: string;
  lastContact: string | null;
  softwareVersion: string;
  ipAddress: string;
}

interface DeviceResponse {
  _id: string;
  _deviceId: {
    _Manufacturer: string;
    _OUI: string;
    _ProductClass: string;
    _SerialNumber: string;
  };
  _lastInform: string;
  Device?: {
    DeviceInfo?: {
      HardwareVersion?: {
        _value: string;
      };
      SoftwareVersion?: {
        _value: string;
      };
    };
    IP?: {
      Interface?: {
        [key: string]: {
          IPv4Address?: {
            [key: string]: {
              IPAddress?: {
                _value: string;
              };
            };
          };
        };
      };
    };
  };
  InternetGatewayDevice?: {
    DeviceInfo?: {
      HardwareVersion?: {
        _value: string;
      };
      SoftwareVersion?: {
        _value: string;
      };
    };
  };
}

interface UseDevicesReturn {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  deleteDevice: (id: string) => Promise<void>;
}

const extractIPAddress = (device: DeviceResponse): string => {
  const ipInterface = device.Device?.IP?.Interface;
  if (!ipInterface) return 'N/A';

  // Look through all interfaces
  for (const interfaceKey in ipInterface) {
    const ipv4Address = ipInterface[interfaceKey].IPv4Address;
    if (!ipv4Address) continue;

    // Look through all IPv4 addresses
    for (const addressKey in ipv4Address) {
      const address = ipv4Address[addressKey].IPAddress?._value;
      if (address) return address;
    }
  }

  return 'N/A';
};

const transformDevice = (response: DeviceResponse): Device => {
  // Try to get device info from both Device and InternetGatewayDevice paths
  const deviceInfo = response.Device?.DeviceInfo || response.InternetGatewayDevice?.DeviceInfo;
  
  // Extract model from HardwareVersion, getting just the model name (EX220)
  const hardwareVersion = deviceInfo?.HardwareVersion?._value || '';
  const modelMatch = hardwareVersion.match(/^(EX220)/);
  const model = modelMatch ? modelMatch[1] : response._deviceId._ProductClass || 'Unknown';
  
  // Improved online/offline status detection - consider device online if last inform was within 10 minutes
  const lastInformTime = response._lastInform ? new Date(response._lastInform).getTime() : 0;
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000); // 10 minutes in milliseconds
  const isOnline = lastInformTime > tenMinutesAgo;
  
  return {
    _id: response._id,
    serialNumber: response._deviceId._SerialNumber || 'Unknown',
    manufacturer: response._deviceId._Manufacturer || 'Unknown',
    model: model,
    status: isOnline ? 'Online' : 'Offline',
    lastContact: response._lastInform || null,
    softwareVersion: deviceInfo?.SoftwareVersion?._value || 'N/A',
    ipAddress: extractIPAddress(response),
  };
};

export const useDevices = (): UseDevicesReturn => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading devices...');
      
      const response = await DevicesAPI.getDevices();
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from API');
      }
      
      const transformedDevices = response.data.map(transformDevice);
      console.log(`✅ Loaded ${transformedDevices.length} devices`);
      
      setDevices(transformedDevices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar dispositivos';
      console.error('❌ Error loading devices:', errorMessage);
      setError(errorMessage);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDevice = async (id: string) => {
    try {
      await DevicesAPI.deleteDevice(id);
      setDevices(prev => prev.filter(device => device._id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Falha ao excluir dispositivo');
    }
  };

  useEffect(() => {
    loadDevices();
  }, [loadDevices, refreshKey]);
  // Listen for auto-refresh events
  useEffect(() => {
    const handleAutoRefresh = (event: any) => {
      console.log('Auto-refresh detected, reloading devices...', event.detail);
      loadDevices();
    };

    const handleAutoRefreshError = (event: any) => {
      console.log('Auto-refresh error detected:', event.detail);
      // Still try to reload devices in case some succeeded
      loadDevices();
    };

    // Listen for custom auto-refresh events
    window.addEventListener('autoRefreshCompleted', handleAutoRefresh);
    window.addEventListener('autoRefreshError', handleAutoRefreshError);
    
    return () => {
      window.removeEventListener('autoRefreshCompleted', handleAutoRefresh);
      window.removeEventListener('autoRefreshError', handleAutoRefreshError);
    };
  }, [loadDevices]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    devices,
    loading,
    error,
    refresh,
    deleteDevice
  };
};
