import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Switch, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip,
  Collapse,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import useAutoRefresh from '../hooks/useAutoRefresh';

interface AutoRefreshControlProps {
  className?: string;
}

const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({ className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    intervalMinutes: 10,
    refreshOnlineDevices: true,
    forceConnectionOfflineDevices: true,
  });

  const { status, startAutoRefresh, stopAutoRefresh, manualRefresh, isRunning } = useAutoRefresh(config);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getTimeUntilNext = () => {
    if (!status.nextRefresh) return null;
    const now = new Date().getTime();
    const next = status.nextRefresh.getTime();
    const diff = next - now;
    return diff > 0 ? formatDuration(diff) : 'Now';
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = () => {
    if (status.errors.length > 0) return <ErrorIcon color="error" />;
    if (isRunning) return <CircularProgress size={20} />;
    if (config.enabled) return <CheckCircleIcon color="success" />;
    return <ScheduleIcon color="disabled" />;
  };  const getStatusText = () => {
    if (status.errors.length > 0) return 'Error';
    if (isRunning) return 'Running';
    if (config.enabled) return 'Active';
    return 'Disabled';
  };

  const getStatusColor = (): "success" | "error" | "info" | "warning" => {
    if (status.errors.length > 0) return 'error';
    if (isRunning) return 'info';
    if (config.enabled) return 'success';
    return 'warning';
  };

  return (
    <Card className={className} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon()}              <Typography variant="h6" component="h3">
                Auto Refresh
              </Typography>
              <Chip 
                label={getStatusText()} 
                color={getStatusColor()}
                size="small"
              />
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              size="small"            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              onClick={manualRefresh}
              disabled={isRunning}
              variant="contained"
              startIcon={<RefreshIcon />}
              size="small"            >
              {isRunning ? 'Running...' : 'Refresh Now'}
            </Button>
          </Box>
        </Box>        {/* Status Summary */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Box flex="1" minWidth="150px" textAlign="center">            <Typography variant="caption" color="textSecondary">
              Last Update
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatTime(status.lastRefresh)}
            </Typography>
          </Box>
          <Box flex="1" minWidth="150px" textAlign="center">            <Typography variant="caption" color="textSecondary">
              Next Update
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {getTimeUntilNext() || 'Disabled'}
            </Typography>
          </Box>
          <Box flex="1" minWidth="150px" textAlign="center">            <Typography variant="caption" color="textSecondary">
              Refresh Count
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {status.refreshCount}
            </Typography>
          </Box>
          <Box flex="1" minWidth="150px" textAlign="center">            <Typography variant="caption" color="textSecondary">
              Intervalo
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {config.intervalMinutes}min
            </Typography>
          </Box>
        </Box>

        {/* Configuration */}
        <Collapse in={showDetails}>
          <Box borderTop={1} borderColor="divider" pt={2}>            <Typography variant="subtitle1" fontWeight="medium" mb={2}>
              Configuration
            </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex="1" minWidth="300px">
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                      />
                    }
                    label="Enable Auto Refresh"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.refreshOnlineDevices}
                        onChange={(e) => handleConfigChange('refreshOnlineDevices', e.target.checked)}
                      />
                    }
                    label="Refresh All Devices"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.forceConnectionOfflineDevices}
                        onChange={(e) => handleConfigChange('forceConnectionOfflineDevices', e.target.checked)}
                      />
                    }
                    label="Force Connection (Offline)"
                  />
                </Box>
              </Box>
              
              <Box flex="1" minWidth="200px">
                <FormControl fullWidth size="small">                  <InputLabel>Interval</InputLabel>
                  <Select
                    value={config.intervalMinutes}
                    label="Interval"
                    onChange={(e) => handleConfigChange('intervalMinutes', e.target.value)}
                  >                    <MenuItem value={5}>5 minutes</MenuItem>
                    <MenuItem value={10}>10 minutes</MenuItem>
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Last Result */}
            {status.lastResult && (
              <Box mt={3}>                <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                  Last Update Results
                </Typography>
                <Box bgcolor="grey.50" borderRadius={1} p={2}>
                  {status.lastResult.refreshAll && (                    <Typography variant="body2" mb={1}>                      <strong>Device Refresh:</strong> {status.lastResult.refreshAll.successCount || 0} successful, 
                      {status.lastResult.refreshAll.failureCount || 0} failed 
                      (Total: {status.lastResult.refreshAll.totalDevices || 0})
                    </Typography>
                  )}
                  {status.lastResult.forceConnection && (                    <Typography variant="body2">                      <strong>Connection Requests:</strong> {status.lastResult.forceConnection.successCount || 0} successful, 
                      {status.lastResult.forceConnection.failureCount || 0} failed 
                      (Offline: {status.lastResult.forceConnection.offlineDevices || 0})
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Errors */}
            {status.errors.length > 0 && (
              <Box mt={3}>                <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                  Errors
                </Typography>
                {status.errors.map((error, index) => (
                  <Alert key={index} severity="error" sx={{ mb: 1 }}>
                    {error}
                  </Alert>
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AutoRefreshControl;
