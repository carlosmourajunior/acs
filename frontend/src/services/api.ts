import axios from 'axios';

// Configuração da URL base da API
const getApiBaseUrl = () => {
  // Se estiver em desenvolvimento e não há proxy configurado, usa diretamente o GenieACS
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_API_BASE_URL || '/api';
  }
  // Em produção, usa o proxy configurado no nginx
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();
const GENIEACS_USERNAME = process.env.REACT_APP_GENIEACS_USERNAME || 'admin';
const GENIEACS_PASSWORD = process.env.REACT_APP_GENIEACS_PASSWORD || 'admin';

console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  username: GENIEACS_USERNAME
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000,
  auth: {
    username: GENIEACS_USERNAME,
    password: GENIEACS_PASSWORD
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] API Request to ${config.url}:`, {
      method: config.method,
      headers: config.headers,
      data: config.data,
      baseURL: config.baseURL,
      url: config.url,
    });
    // @ts-ignore
    config.metadata = { startTime: new Date(), requestId };
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(new Error('Falha ao enviar requisição'));
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    // @ts-ignore
    const { startTime, requestId } = response.config.metadata;
    const duration = new Date().getTime() - startTime.getTime();
    
    console.log(`[${requestId}] API Response from ${response.config.url} (${duration}ms):`, {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error('Full API Error:', error);
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      switch (error.response.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your data.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 405:
          errorMessage = 'Method not allowed.';
          break;
        case 408:
        case 504:
          errorMessage = 'Request timeout. Please try again.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server returned error: ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', {
        request: error.request,
        message: 'No response received - possible CORS or network issue',
      });
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
      errorMessage = 'Falha ao enviar requisição. Tente novamente.';
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export const DevicesAPI = {
  getDevices: async () => {
    try {
      const response = await api.get('/devices');
      return response;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },
  getDevice: async (id: string) => {
    try {
      // GenieACS API uses query parameter to filter devices by ID
      const query = JSON.stringify({ "_id": id });
      const response = await api.get(`/devices?query=${encodeURIComponent(query)}`);
      
      // The API returns an array, so we need to get the first (and only) result
      if (response.data && response.data.length > 0) {
        return { ...response, data: response.data[0] };
      } else {
        throw new Error('Device not found');
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      throw error;
    }
  },
  // Get device parameters
  getDeviceParameters: async (deviceId: string) => {
    try {
      // GenieACS API uses query parameter to filter devices by ID with projection
      const query = JSON.stringify({ "_id": deviceId });
      const response = await api.get(`/devices?query=${encodeURIComponent(query)}`);
      
      // The API returns an array, so we need to get the first (and only) result
      if (response.data && response.data.length > 0) {
        return { ...response, data: response.data[0] };
      } else {
        throw new Error('Device not found');
      }
    } catch (error) {
      console.error('Error fetching device parameters:', error);
      throw error;
    }
  },  // Set device parameter value
  setDeviceParameter: async (deviceId: string, paramName: string, paramValue: string) => {
    try {
      // GenieACS uses POST method for creating tasks
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "setParameterValues",
        parameterValues: [[paramName, paramValue, "xsd:string"]]
      });
      return response;
    } catch (error) {
      console.error('Error setting device parameter:', error);
      throw error;
    }
  },
  // Get device parameter value
  getDeviceParameterValue: async (deviceId: string, paramName: string) => {
    try {
      const query = JSON.stringify({ "_id": deviceId });
      const encodedParam = encodeURIComponent(paramName);
      const response = await api.get(`/devices?query=${encodeURIComponent(query)}&projection=${encodedParam}`);
      
      if (response.data && response.data.length > 0) {
        return { ...response, data: response.data[0] };
      } else {
        throw new Error('Device not found');
      }
    } catch (error) {
      console.error('Error fetching device parameter value:', error);
      throw error;
    }
  },  // Refresh device parameters (sends GetParameterValues RPC to the device)
  refreshDeviceParameters: async (deviceId: string, parameterNames?: string[]) => {
    try {
      // GenieACS uses POST method for creating tasks
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "getParameterValues",
        parameterNames: parameterNames || ["*"]
      });
      return response;
    } catch (error) {
      console.error('Error refreshing device parameters:', error);
      throw error;
    }
  },
  
  // Force device connection (sends a Connection Request to the device)
  forceConnection: async (deviceId: string) => {
    try {
      // Create a connection request task
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "connectionRequest"
      });
      return response;
    } catch (error) {
      console.error('Error forcing device connection:', error);
      throw error;
    }
  },
  
  // Update device status by refreshing basic device information
  refreshDeviceStatus: async (deviceId: string) => {
    try {
      // GenieACS uses POST method for creating tasks to get basic device info
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "getParameterValues",
        parameterNames: [
          "Device.DeviceInfo.HardwareVersion",
          "Device.DeviceInfo.SoftwareVersion",
          "Device.DeviceInfo.UpTime",
          "Device.DeviceInfo.SerialNumber",
          "Device.DeviceInfo.Manufacturer",
          "Device.DeviceInfo.ModelName",
          "Device.ManagementServer.ConnectionRequestURL",
          "Device.ManagementServer.ParameterKey"
        ]
      });
      return response;
    } catch (error) {
      console.error('Error refreshing device status:', error);
      throw error;
    }
  },
  
  // Reboot device
  rebootDevice: async (deviceId: string) => {
    try {
      // GenieACS uses POST method for creating reboot tasks
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "reboot"
      });
      return response;
    } catch (error) {
      console.error('Error rebooting device:', error);
      throw error;
    }
  },
  
  // Factory reset device
  factoryResetDevice: async (deviceId: string) => {
    try {
      // GenieACS uses POST method for creating factory reset tasks
      const response = await api.post(`/tasks`, {
        device: deviceId,
        name: "factoryReset"
      });
      return response;
    } catch (error) {
      console.error('Error factory resetting device:', error);
      throw error;
    }
  },
  
  // Get device tasks status
  getDeviceTasks: async (deviceId: string) => {
    try {
      const query = JSON.stringify({ "device": deviceId });
      const response = await api.get(`/tasks?query=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Error fetching device tasks:', error);
      throw error;
    }
  },
  
  // Delete a specific task
  deleteTask: async (taskId: string) => {
    try {
      const query = JSON.stringify({ "_id": taskId });
      const response = await api.delete(`/tasks?query=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
  
  // Check device connectivity status
  checkDeviceConnectivity: async (deviceId: string) => {
    try {
      // Get device info with connection-related parameters
      const query = JSON.stringify({ "_id": deviceId });
      const projection = [
        "_lastInform",
        "_lastBoot", 
        "_lastBootstrap",
        "_registered",
        "_deviceId._Manufacturer",
        "_deviceId._ModelName",
        "_deviceId._SerialNumber",
        "Device.DeviceInfo.UpTime",
        "Device.ManagementServer.ConnectionRequestURL"
      ].join(",");
      
      const response = await api.get(`/devices?query=${encodeURIComponent(query)}&projection=${encodeURIComponent(projection)}`);
        if (response.data && response.data.length > 0) {
        const deviceData = response.data[0];
        const now = Date.now();
        const lastInform = deviceData._lastInform ? new Date(deviceData._lastInform).getTime() : 0;
        const timeSinceLastInform = now - lastInform;
        
        // Consider device online if last inform was within 10 minutes (600000ms)
        const isOnline = lastInform > 0 && timeSinceLastInform < 600000;
        
        return { 
          ...response, 
          data: {
            ...deviceData,
            isOnline,
            lastInformAgo: timeSinceLastInform,
            lastInformFormatted: deviceData._lastInform ? new Date(deviceData._lastInform).toLocaleString() : 'Never'
          }
        };
      } else {
        throw new Error('Device not found');
      }
    } catch (error) {
      console.error('Error checking device connectivity:', error);
      throw error;
    }
  },

  // Refresh all devices information
  refreshAllDevices: async () => {
    try {
      // First get all devices
      const devicesResponse = await api.get('/devices');
      const devices = devicesResponse.data || [];
      
      console.log(`Starting refresh for ${devices.length} devices...`);
      
      // Create refresh tasks for all devices
      const refreshPromises = devices.map(async (device: any) => {
        try {
          // Create a task to refresh basic device info for each device
          await api.post(`/tasks`, {
            device: device._id,
            name: "getParameterValues",
            parameterNames: [
              "Device.DeviceInfo.HardwareVersion",
              "Device.DeviceInfo.SoftwareVersion",
              "Device.DeviceInfo.UpTime",
              "Device.DeviceInfo.SerialNumber",
              "Device.DeviceInfo.Manufacturer",
              "Device.DeviceInfo.ModelName",
              "Device.ManagementServer.ConnectionRequestURL",
              "Device.ManagementServer.ParameterKey"
            ]
          });
          return { deviceId: device._id, success: true };
        } catch (error) {
          console.error(`Error creating refresh task for device ${device._id}:`, error);
          return { deviceId: device._id, success: false, error };
        }
      });
      
      // Wait for all refresh tasks to be created
      const results = await Promise.all(refreshPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`Refresh tasks created: ${successCount} successful, ${failureCount} failed`);
      
      return {
        data: {
          totalDevices: devices.length,
          successCount,
          failureCount,
          results
        }
      };
    } catch (error) {
      console.error('Error refreshing all devices:', error);
      throw error;
    }
  },

  // Force connection for all offline devices
  forceConnectionAllOffline: async () => {
    try {
      // Get all devices with their last inform time
      const devicesResponse = await api.get('/devices?projection=_id,_lastInform');
      const devices = devicesResponse.data || [];
      
      const now = Date.now();      // Filter devices that haven't informed in the last 10 minutes
      const offlineDevices = devices.filter((device: any) => {
        if (!device._lastInform) return true; // Device never connected
        const lastInform = new Date(device._lastInform).getTime();
        const timeSinceLastInform = now - lastInform;
        return timeSinceLastInform > 600000; // 10 minutes
      });
      
      console.log(`Found ${offlineDevices.length} offline devices out of ${devices.length} total devices`);
      
      // Create connection request tasks for offline devices
      const connectionPromises = offlineDevices.map(async (device: any) => {
        try {
          await api.post(`/tasks`, {
            device: device._id,
            name: "connectionRequest"
          });
          return { deviceId: device._id, success: true };
        } catch (error) {
          console.error(`Error creating connection request for device ${device._id}:`, error);
          return { deviceId: device._id, success: false, error };
        }
      });
      
      const results = await Promise.all(connectionPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`Connection requests created: ${successCount} successful, ${failureCount} failed`);
      
      return {
        data: {
          totalDevices: devices.length,
          offlineDevices: offlineDevices.length,
          successCount,
          failureCount,
          results
        }
      };    } catch (error) {
      console.error('Error forcing connection for offline devices:', error);
      throw error;
    }
  },

  // Delete device
  deleteDevice: async (id: string) => {
    try {
      // GenieACS uses query parameter to delete devices
      const query = JSON.stringify({ "_id": id });
      const response = await api.delete(`/devices?query=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  },
} as const;

export const PresetAPI = {
  getPresets: () => api.get('/presets'),
  createPreset: (data: any) => api.post('/presets', data),
  updatePreset: (id: string, data: any) => api.put(`/presets/${id}`, data),
  deletePreset: (id: string) => api.delete(`/presets/${id}`),
};

export default api;
