import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import Header from '../components/Header';
import { DevicesAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Helper functions to extract data from GenieACS device structure
const getDeviceValue = (device: any, path: string) => {
  const parts = path.split('.');
  let current = device;
  
  for (const part of parts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      return 'N/A';
    }
  }
  
  return current._value || current || 'N/A';
};

const getDeviceInfo = (device: any) => {
  return {
    serialNumber: device._deviceId?._SerialNumber || device._id || 'N/A',
    manufacturer: device._deviceId?._Manufacturer || 'N/A',
    model: device._deviceId?._ProductClass || 'N/A',
    softwareVersion: getDeviceValue(device, 'Device.DeviceInfo.SoftwareVersion'),
    hardwareVersion: getDeviceValue(device, 'Device.DeviceInfo.HardwareVersion'),
    connectionRequestUrl: getDeviceValue(device, 'Device.ManagementServer.ConnectionRequestURL'),
    ip: getDeviceValue(device, 'Device.IP.Interface.1.IPv4Address.1.IPAddress'),
    lastContact: device._lastInform ? new Date(device._lastInform).toLocaleString() : 'N/A',
    status: device._lastInform ? 'Online' : 'Offline',
    registrationDate: device._registered ? new Date(device._registered).toLocaleString() : 'N/A'
  };
};

interface Parameter {
  name: string;
  value: string;
  writable: boolean;
  type: string;
}

interface DeviceInfo {
  serialNumber: string;
  manufacturer: string;
  model: string;
  softwareVersion: string;
  hardwareVersion: string;
  connectionRequestUrl: string;
  ip: string;
  lastContact: string;
  status: string;
  registrationDate: string;
}

interface APIError {
  message: string;
  code?: string;
  details?: any;
}

const ParametersTab: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingParam, setEditingParam] = useState<{name: string, value: string} | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const loadParameters = async () => {
    try {
      setLoading(true);
      const response = await DevicesAPI.getDeviceParameters(deviceId);
      const params = Object.entries(response.data).map(([name, details]: [string, any]) => ({
        name,
        value: details._value || '',
        writable: details._writable || false,
        type: details._type || 'string'
      }));
      setParameters(params);
    } catch (error) {
      console.error('Error loading parameters:', error);
      showNotification('Failed to load parameters. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshParameters = async () => {
    try {
      setLoading(true);
      await DevicesAPI.refreshDeviceParameters(deviceId);
      showNotification('Refreshing device parameters...', 'info');
      await loadParameters();
      showNotification('Parameters updated successfully', 'success');
    } catch (error) {
      console.error('Error refreshing parameters:', error);
      showNotification('Failed to refresh parameters. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParameter = async (name: string, value: string) => {
    try {
      setUpdateLoading(true);
      await DevicesAPI.setDeviceParameter(deviceId, name, value);
      await loadParameters();
      setEditingParam(null);
      showNotification(`Parameter "${name}" updated successfully`, 'success');
    } catch (error) {
      console.error('Error updating parameter:', error);
      showNotification(`Failed to update parameter "${name}". Please try again.`, 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    loadParameters();
  }, [deviceId]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredParameters = parameters.filter(param =>
    param.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedParameters = filteredParameters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search parameters..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
        <IconButton onClick={handleRefreshParameters} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>              <TableCell>Parâmetro</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="center">Editável</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedParameters.map((param) => (
              <TableRow key={param.name} hover>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={param.name} placement="top-start">
                    <span>{param.name}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {editingParam?.name === param.name ? (
                    <TextField
                      size="small"
                      value={editingParam.value}
                      onChange={(e) => setEditingParam({ ...editingParam, value: e.target.value })}
                      fullWidth
                      disabled={updateLoading}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateParameter(param.name, editingParam.value);
                        }
                      }}
                    />
                  ) : (
                    <Tooltip title={param.value} placement="top-start">
                      <span>{param.value}</span>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title={`Tipo de parâmetro: ${param.type}`}>
                    <span>{param.type}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={param.writable ? 'Este parâmetro pode ser modificado' : 'Este parâmetro é somente leitura'}>
                    <span>{param.writable ? 'Yes' : 'No'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  {param.writable && (
                    editingParam?.name === param.name ? (
                      <>
                        <Tooltip title="Salvar alterações">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateParameter(param.name, editingParam.value)}
                              disabled={updateLoading}
                            >
                              {updateLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Cancelar edição">
                          <IconButton
                            size="small"
                            onClick={() => setEditingParam(null)}
                            disabled={updateLoading}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Editar parâmetro">
                        <IconButton
                          size="small"
                          onClick={() => setEditingParam({ name: param.name, value: param.value })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredParameters.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

interface WiFiConfig {
  ssid: string;
  enabled: boolean;
  channel: string;
  band: string;
  beaconType: string;
  encryption: string;
  bssid: string;
  transmitPower: string;
  radioEnabled: boolean;
  ssidAdvertisementEnabled: boolean;
  totalAssociations: string;
  bandwidth: string;
  standard: string;
  autoChannelEnable: boolean;
  keyPassphrase: string;
  wpaAuthenticationMode: string;
  wpaEncryptionModes: string;
}

const WiFiTab: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const [loading, setLoading] = useState(false);
  const [wifiConfigs, setWifiConfigs] = useState<{ [key: string]: WiFiConfig }>({});
  const [editingField, setEditingField] = useState<{ network: string, field: string, value: string } | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };  const loadWiFiConfigurations = async () => {
    try {
      setLoading(true);
      // Use getDevice instead of getDeviceParameters to get complete device data
      const response = await DevicesAPI.getDevice(deviceId);
      
      // The API service already adjusts the response to put the device data in response.data
      const data = response.data;
      
      console.log('Device data received for WiFi:', data);
      const wifiData: { [key: string]: WiFiConfig } = {};
      
      // Extract WiFi configurations for both bands (2.4GHz and 5GHz)
      if (data?.InternetGatewayDevice?.LANDevice?.['1']?.WLANConfiguration) {
        const wlanConfigs = data.InternetGatewayDevice.LANDevice['1'].WLANConfiguration;
        
        console.log('WLAN Configurations found:', wlanConfigs);
        
        Object.keys(wlanConfigs).forEach(configKey => {
          if (configKey !== '_object' && configKey !== '_timestamp' && configKey !== '_writable') {
            const config = wlanConfigs[configKey];
            const networkName = configKey === '1' ? '2.4GHz' : configKey === '3' ? '5GHz' : `Network ${configKey}`;
            
            console.log(`Processing ${networkName} configuration:`, config);
            
            // Helper function to safely get parameter values with improved handling
            const getParamValue = (param: any, defaultValue: any = 'N/A') => {
              if (!param) return defaultValue;
              
              // If we have a value, return it
              if (param._value !== undefined && param._value !== null && param._value !== '') {
                return param._value;
              }
              
              // If it's writable but no value, it means it can be configured
              if (param._object === false && param._writable === true) {
                return 'Não configurado';
              }
              
              // If it's not writable and no value, it's not available on this device
              if (param._object === false && param._writable === false) {
                return 'Não suportado';
              }
              
              return defaultValue;
            };
            
            const getBooleanValue = (param: any, defaultValue: boolean = false) => {
              if (!param) return defaultValue;
              
              // If we have a value, return it as boolean
              if (param._value !== undefined && param._value !== null) {
                return Boolean(param._value);
              }
              
              // If it's writable but no value, assume it's configurable (typically means enabled)
              if (param._object === false && param._writable === true) {
                return true;
              }
              
              return defaultValue;
            };
            
            wifiData[networkName] = {
              ssid: getParamValue(config.SSID, 'Não configurado'),
              enabled: getBooleanValue(config.Enable, false),
              channel: getParamValue(config.Channel, 'Auto'),
              band: networkName, // Use the network name as band identifier
              beaconType: getParamValue(config.BeaconType, 'WPA2-PSK'),
              encryption: getParamValue(config.IEEE11iEncryptionModes) !== 'N/A' && getParamValue(config.IEEE11iEncryptionModes) !== 'Não configurado'
                          ? getParamValue(config.IEEE11iEncryptionModes)
                          : getParamValue(config.WPAEncryptionModes, 'AES'),
              bssid: getParamValue(config.BSSID, 'Não disponível'),
              transmitPower: getParamValue(config.TransmitPower, '100%'),
              radioEnabled: getBooleanValue(config.RadioEnabled, true),
              ssidAdvertisementEnabled: getBooleanValue(config.SSIDAdvertisementEnabled, true),
              totalAssociations: getParamValue(config.TotalAssociations, '0'),
              bandwidth: getParamValue(config.X_TP_Bandwidth, 'Auto'),
              standard: getParamValue(config.Standard, '802.11n'),
              autoChannelEnable: getBooleanValue(config.AutoChannelEnable, true),
              keyPassphrase: getParamValue(config.KeyPassphrase, ''),
              wpaAuthenticationMode: getParamValue(config.WPAAuthenticationMode) !== 'N/A' && getParamValue(config.WPAAuthenticationMode) !== 'Não configurado'
                                     ? getParamValue(config.WPAAuthenticationMode)
                                     : getParamValue(config.IEEE11iAuthenticationMode, 'PSK'),
              wpaEncryptionModes: getParamValue(config.WPAEncryptionModes) !== 'N/A' && getParamValue(config.WPAEncryptionModes) !== 'Não configurado'
                                  ? getParamValue(config.WPAEncryptionModes)
                                  : getParamValue(config.IEEE11iEncryptionModes, 'AES')
            };
            
            console.log(`${networkName} WiFi config created:`, wifiData[networkName]);
          }
        });
      } else {
        console.warn('No WLAN configurations found in InternetGatewayDevice path');
        
        // Log the device structure for debugging
        console.log('Device structure analysis:', {
          hasInternetGatewayDevice: !!data?.InternetGatewayDevice,
          hasLANDevice: !!data?.InternetGatewayDevice?.LANDevice,
          LANDeviceKeys: data?.InternetGatewayDevice?.LANDevice ? Object.keys(data.InternetGatewayDevice.LANDevice) : [],
          hasLANDevice1: !!data?.InternetGatewayDevice?.LANDevice?.['1'],
          LANDevice1Keys: data?.InternetGatewayDevice?.LANDevice?.['1'] ? Object.keys(data.InternetGatewayDevice.LANDevice['1']) : []
        });
        
        // Try alternative TR-181 path
        if (data?.Device?.WiFi?.Radio) {
          console.log('Found Device.WiFi structure, attempting to parse TR-181 model');
          const wifiRadios = data.Device.WiFi.Radio;
          
          Object.keys(wifiRadios).forEach(radioKey => {
            if (radioKey !== '_object' && radioKey !== '_timestamp' && radioKey !== '_writable') {
              const radio = wifiRadios[radioKey];
              console.log(`Found radio ${radioKey}:`, radio);
              
              // Extract SSID configurations from this radio
              if (radio.SSID) {
                Object.keys(radio.SSID).forEach(ssidKey => {
                  if (ssidKey !== '_object' && ssidKey !== '_timestamp' && ssidKey !== '_writable') {
                    const ssid = radio.SSID[ssidKey];
                    const networkName = radioKey === '1' ? '2.4GHz' : radioKey === '2' ? '5GHz' : `Radio ${radioKey} SSID ${ssidKey}`;
                    
                    console.log(`Processing ${networkName} from TR-181:`, ssid);
                    
                    const getParamValue = (param: any, defaultValue: any = 'N/A') => {
                      if (!param) return defaultValue;
                      if (param._value !== undefined && param._value !== null && param._value !== '') {
                        return param._value;
                      }
                      return defaultValue;
                    };
                    
                    const getBooleanValue = (param: any, defaultValue: boolean = false) => {
                      if (!param) return defaultValue;
                      if (param._value !== undefined && param._value !== null) {
                        return Boolean(param._value);
                      }
                      return defaultValue;
                    };
                    
                    wifiData[networkName] = {
                      ssid: getParamValue(ssid.SSID, 'Não configurado'),
                      enabled: getBooleanValue(ssid.Enable, false),
                      channel: getParamValue(radio.Channel, 'Auto'),
                      band: networkName,
                      beaconType: getParamValue(ssid.Security?.ModeEnabled, 'WPA2-PSK'),
                      encryption: getParamValue(ssid.Security?.EncryptionMode, 'AES'),
                      bssid: getParamValue(ssid.BSSID, 'Não disponível'),
                      transmitPower: getParamValue(radio.TransmitPower, '100%'),
                      radioEnabled: getBooleanValue(radio.Enable, true),
                      ssidAdvertisementEnabled: getBooleanValue(ssid.SSIDAdvertisementEnabled, true),
                      totalAssociations: getParamValue(ssid.Stats?.AssociatedDeviceNumberOfEntries, '0'),
                      bandwidth: getParamValue(radio.OperatingChannelBandwidth, 'Auto'),
                      standard: getParamValue(radio.OperatingStandards, '802.11n'),
                      autoChannelEnable: getBooleanValue(radio.AutoChannelEnable, true),
                      keyPassphrase: getParamValue(ssid.Security?.KeyPassphrase, ''),
                      wpaAuthenticationMode: getParamValue(ssid.Security?.ModeEnabled, 'PSK'),
                      wpaEncryptionModes: getParamValue(ssid.Security?.EncryptionMode, 'AES')
                    };
                    
                    console.log(`${networkName} WiFi config created from TR-181:`, wifiData[networkName]);
                  }
                });
              }
            }
          });
        } else {
          console.warn('No WiFi configurations found in either TR-098 or TR-181 paths');
          console.log('Available top-level keys:', Object.keys(data || {}));
        }
      }
      
      console.log('Final WiFi configurations processed:', wifiData);
      console.log('Number of WiFi networks found:', Object.keys(wifiData).length);
      setWifiConfigs(wifiData);
    } catch (error) {
      console.error('Error loading WiFi configurations:', error);
      showNotification('Falha ao carregar configurações WiFi. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };  const handleRefreshWiFi = async () => {
    try {
      setLoading(true);
      showNotification('Atualizando configurações WiFi...', 'info');
      
      // Create refresh task for WiFi parameters specifically
      const wifiParams = [
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.RadioEnabled',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSIDAdvertisementEnabled',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.TransmitPower',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.AutoChannelEnable',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Standard',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_TP_Bandwidth',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.WPAAuthenticationMode',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.WPAEncryptionModes',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.IEEE11iAuthenticationMode',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.IEEE11iEncryptionModes',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BSSID',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.TotalAssociations',
        
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.SSID',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.Enable',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.Channel',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.BeaconType',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.RadioEnabled',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.SSIDAdvertisementEnabled',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.TransmitPower',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.AutoChannelEnable',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.Standard',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.X_TP_Bandwidth',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.KeyPassphrase',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.WPAAuthenticationMode',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.WPAEncryptionModes',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.IEEE11iAuthenticationMode',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.IEEE11iEncryptionModes',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.BSSID',
        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.3.TotalAssociations'
      ];
      
      // Create a task to refresh WiFi parameters
      try {
        await DevicesAPI.refreshDeviceParameters(deviceId, wifiParams);
        console.log('WiFi refresh task created successfully');
      } catch (refreshError) {
        console.warn('WiFi parameter refresh failed, trying general refresh:', refreshError);
        // Fallback to general refresh if specific parameter refresh fails
        await DevicesAPI.refreshDeviceParameters(deviceId);
      }
      
      // Wait a moment for the device to process the refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then reload the WiFi configurations with fresh data
      await loadWiFiConfigurations();
      showNotification('Configurações WiFi atualizadas com sucesso', 'success');
    } catch (error) {
      console.error('Error refreshing WiFi configurations:', error);
      showNotification('Falha ao atualizar configurações WiFi. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParameter = async (network: string, field: string, value: string) => {
    try {
      setUpdateLoading(true);
      
      // Map network name to config index
      const networkIndex = network === '2.4GHz' ? '1' : network === '5GHz' ? '3' : '1';
      
      // Map field names to TR-069 parameter names
      const fieldMap: { [key: string]: string } = {
        ssid: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.SSID`,
        enabled: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.Enable`,
        channel: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.Channel`,
        beaconType: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.BeaconType`,
        transmitPower: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.TransmitPower`,
        radioEnabled: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.RadioEnabled`,
        ssidAdvertisementEnabled: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.SSIDAdvertisementEnabled`,
        bandwidth: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.X_TP_Bandwidth`,
        autoChannelEnable: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.AutoChannelEnable`,
        keyPassphrase: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.KeyPassphrase`,
        wpaAuthenticationMode: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.WPAAuthenticationMode`,
        wpaEncryptionModes: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${networkIndex}.WPAEncryptionModes`
      };
      
      const parameterName = fieldMap[field];
      if (!parameterName) {
        throw new Error('Campo não suportado para edição');
      }
      
      await DevicesAPI.setDeviceParameter(deviceId, parameterName, value);
      await loadWiFiConfigurations();
      setEditingField(null);
      showNotification(`Parâmetro "${field}" da rede ${network} atualizado com sucesso`, 'success');
    } catch (error) {
      console.error('Error updating WiFi parameter:', error);
      showNotification(`Falha ao atualizar parâmetro "${field}" da rede ${network}. Tente novamente.`, 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    loadWiFiConfigurations();
  }, [deviceId]);
  const renderEditableField = (network: string, field: string, value: string | boolean, isWritable: boolean = true, fieldType: 'text' | 'boolean' = 'text') => {
    const isEditing = editingField?.network === network && editingField?.field === field;
    const displayValue = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value;
    
    // Check if value indicates it's not configured or not available
    const isNotConfigured = value === 'Não configurado' || value === 'Não configurada';
    const isNotSupported = value === 'Não suportado' || value === 'Não disponível';
    const isEmpty = value === '' || value === 'N/A';
    
    if (!isWritable || isNotSupported) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            color: isNotSupported ? 'warning.main' : 'text.secondary',
            fontStyle: isNotSupported ? 'italic' : 'normal'
          }}
        >
          {displayValue}
        </Typography>
      );
    }

    if (isEditing) {
      if (fieldType === 'boolean') {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <select
              value={editingField.value}
              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
              disabled={updateLoading}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
            <Tooltip title="Salvar alterações">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateParameter(network, field, editingField.value)}
                  disabled={updateLoading}
                >
                  {updateLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancelar edição">
              <IconButton
                size="small"
                onClick={() => setEditingField(null)}
                disabled={updateLoading}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      } else {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              value={editingField.value}
              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
              disabled={updateLoading}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateParameter(network, field, editingField.value);
                }
              }}
              sx={{ minWidth: 150 }}
              placeholder={isNotConfigured || isEmpty ? 'Digite o valor...' : ''}
            />
            <Tooltip title="Salvar alterações">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateParameter(network, field, editingField.value)}
                  disabled={updateLoading}
                >
                  {updateLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancelar edição">
              <IconButton
                size="small"
                onClick={() => setEditingField(null)}
                disabled={updateLoading}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="body2"
          sx={{ 
            color: isNotConfigured || isEmpty ? 'warning.main' : 'text.primary',
            fontStyle: isNotConfigured || isEmpty ? 'italic' : 'normal'
          }}
        >
          {displayValue}
        </Typography>
        <Tooltip title={isNotConfigured || isEmpty ? 'Configurar valor' : 'Editar'}>
          <IconButton
            size="small"
            onClick={() => setEditingField({ 
              network, 
              field, 
              value: fieldType === 'boolean' ? value.toString() : (isEmpty || isNotConfigured ? '' : value.toString())
            })}
            sx={{ 
              color: isNotConfigured || isEmpty ? 'warning.main' : 'action.active' 
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Configurações WiFi
        </Typography>
        <IconButton onClick={handleRefreshWiFi} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>      {loading && <LinearProgress sx={{ mb: 2 }} />}      {Object.keys(wifiConfigs).length === 0 && !loading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma configuração WiFi encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            As configurações WiFi não puderam ser carregadas para este dispositivo.
            Clique no botão abaixo para tentar buscar os dados WiFi do dispositivo.
          </Typography>
          <IconButton 
            onClick={handleRefreshWiFi} 
            disabled={loading}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              p: 2,
              mr: 1
            }}
          >
            <RefreshIcon />
          </IconButton>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Buscar configurações WiFi
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {Object.entries(wifiConfigs).map(([networkName, config]) => (
            <Paper key={networkName} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                color: networkName === '2.4GHz' ? 'primary.main' : 'secondary.main',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Rede {networkName}</span>
                {/* Status indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: config.enabled ? 'success.main' : 'error.main' 
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {config.enabled ? 'Ativa' : 'Inativa'}
                  </Typography>
                </Box>
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Configurações Básicas
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        SSID (Nome da Rede)
                      </Typography>
                      {renderEditableField(networkName, 'ssid', config.ssid)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Rede Habilitada
                      </Typography>
                      {renderEditableField(networkName, 'enabled', config.enabled, true, 'boolean')}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Rádio Habilitado
                      </Typography>
                      {renderEditableField(networkName, 'radioEnabled', config.radioEnabled, true, 'boolean')}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Broadcast SSID
                      </Typography>
                      {renderEditableField(networkName, 'ssidAdvertisementEnabled', config.ssidAdvertisementEnabled, true, 'boolean')}
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Configurações de Canal e Potência
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Canal
                      </Typography>
                      {renderEditableField(networkName, 'channel', config.channel)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Canal Automático
                      </Typography>
                      {renderEditableField(networkName, 'autoChannelEnable', config.autoChannelEnable, true, 'boolean')}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Largura de Banda
                      </Typography>
                      {renderEditableField(networkName, 'bandwidth', config.bandwidth)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Potência de Transmissão
                      </Typography>
                      {renderEditableField(networkName, 'transmitPower', config.transmitPower)}
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Segurança
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Tipo de Beacon
                      </Typography>
                      {renderEditableField(networkName, 'beaconType', config.beaconType)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Modo de Autenticação WPA
                      </Typography>
                      {renderEditableField(networkName, 'wpaAuthenticationMode', config.wpaAuthenticationMode)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Modos de Criptografia WPA
                      </Typography>
                      {renderEditableField(networkName, 'wpaEncryptionModes', config.wpaEncryptionModes)}
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Senha da Rede
                      </Typography>
                      {renderEditableField(networkName, 'keyPassphrase', config.keyPassphrase || 'Não configurada')}
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Informações da Rede
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        BSSID
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {config.bssid}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Banda
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {config.band}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Padrão
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {config.standard}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Total de Associações
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {config.totalAssociations}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              {/* Show a note if many values are missing */}
              {(config.ssid === 'Não configurado' || 
                config.channel === 'Não configurado' || 
                config.transmitPower === 'Não configurado') && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="warning.dark">
                    ⚠️ Alguns parâmetros ainda não foram consultados do dispositivo. 
                    Clique no botão "Atualizar" acima para buscar os valores mais recentes.
                  </Typography>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const DeviceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadDeviceDetails();
  }, [id]);

  const loadDeviceDetails = async () => {
    try {
      if (id) {
        setLoading(true);
        setError(null);
        console.log('Loading device details for ID:', id);
        const response = await DevicesAPI.getDevice(id);
        console.log('Device details loaded:', response.data);
        setDevice(response.data);
      }
    } catch (error: any) {
      console.error('Error loading device details:', error);
      setError(error.message || 'Falha ao carregar detalhes do dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading device details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography>
          Device ID: {id}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <IconButton onClick={loadDeviceDetails} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Typography variant="caption" sx={{ ml: 1 }}>
            Clique para tentar novamente
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!device) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Dispositivo não encontrado
        </Alert>
        <Typography>
          Device ID: {id}
        </Typography>
      </Box>
    );
  }

  // Extract device information using helper function
  const deviceInfo = getDeviceInfo(device);

  return (
    <Box p={3}>
      <Header
        title={`Dispositivo: ${deviceInfo.serialNumber}`}
        subtitle={`${deviceInfo.manufacturer} ${deviceInfo.model}`}
      />

      <Paper sx={{ width: '100%', mb: 2 }}>        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Visão Geral" />
            <Tab label="Parâmetros" />
            <Tab label="WiFi" />
            <Tab label="Tarefas" />
            <Tab label="Eventos" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>              <Typography variant="h6" gutterBottom>
                Informações do Dispositivo
              </Typography>
              <Box component={Paper} p={2}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Número de Série</Typography>
                    <Typography>{deviceInfo.serialNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography>{deviceInfo.status}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Último Contato</Typography>
                    <Typography>{deviceInfo.lastContact}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Endereço IP</Typography>
                    <Typography>{deviceInfo.ip}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Fabricante</Typography>
                    <Typography>{deviceInfo.manufacturer}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Modelo</Typography>
                    <Typography>{deviceInfo.model}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box>              <Typography variant="h6" gutterBottom>
                Detalhes da Conexão
              </Typography>
              <Box component={Paper} p={2}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Connection Request URL</Typography>
                    <Typography sx={{ wordBreak: 'break-all' }}>{deviceInfo.connectionRequestUrl}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Versão do Software</Typography>
                    <Typography>{deviceInfo.softwareVersion}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Versão do Hardware</Typography>
                    <Typography>{deviceInfo.hardwareVersion}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Data de Registro</Typography>
                    <Typography>{deviceInfo.registrationDate}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </TabPanel>        <TabPanel value={tabValue} index={1}>
          <ParametersTab deviceId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <WiFiTab deviceId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Tasks tab content */}
          <Typography>Conteúdo de tarefas em breve...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {/* Events tab content */}
          <Typography>Conteúdo de eventos em breve...</Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DeviceDetailsPage;
