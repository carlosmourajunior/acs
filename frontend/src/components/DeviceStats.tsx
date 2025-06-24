import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  Devices as DevicesIcon,
  CheckCircle as OnlineIcon,
  Error as OfflineIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Device {
  _id: string;
  status: string;
  lastContact: string | null;
}

interface DeviceStatsProps {
  devices: Device[];
  loading: boolean;
}

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  pending: number;
  lastRefresh: Date | null;
}

const DeviceStats: React.FC<DeviceStatsProps> = ({ devices, loading }) => {
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
    pending: 0,
    lastRefresh: null
  });

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const calculateStats = () => {
      const now = Date.now();
      let online = 0;
      let offline = 0;
      let pending = 0;

      devices.forEach(device => {
        if (device.lastContact) {
          const lastContact = new Date(device.lastContact).getTime();
          const timeDiff = now - lastContact;
          
          // Consider online if last contact was within 5 minutes
          if (timeDiff < 300000) {
            online++;
          } 
          // Consider pending if last contact was within 10 minutes
          else if (timeDiff < 600000) {
            pending++;
          } 
          // Otherwise offline
          else {
            offline++;
          }
        } else {
          offline++;
        }
      });

      setStats({
        total: devices.length,
        online,
        offline,
        pending,
        lastRefresh: new Date()
      });
      setLastUpdate(new Date());
    };

    calculateStats();
  }, [devices]);

  // Listen for auto-refresh events
  useEffect(() => {
    const handleAutoRefresh = () => {
      setStats(prev => ({ ...prev, lastRefresh: new Date() }));
    };

    window.addEventListener('autoRefreshCompleted', handleAutoRefresh);
    
    return () => {
      window.removeEventListener('autoRefreshCompleted', handleAutoRefresh);
    };
  }, []);

  const getOnlinePercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.online / stats.total) * 100);
  };

  const getStatusColor = (status: 'online' | 'pending' | 'offline') => {
    switch (status) {
      case 'online': return 'success';
      case 'pending': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>          <Box display="flex" alignItems="center" mb={2}>
            <DevicesIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Estatísticas dos Dispositivos</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <DevicesIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Estatísticas dos Dispositivos</Typography>
          </Box>
          <Typography variant="caption" color="textSecondary">
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} sx={{ mb: 2 }} flexWrap="wrap">
          <Box flex="1" minWidth="120px">
            <Box textAlign="center" p={1} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.total}
              </Typography>              <Typography variant="caption" color="textSecondary">
                Total de Dispositivos
              </Typography>
            </Box>
          </Box>
          
          <Box flex="1" minWidth="120px">
            <Box textAlign="center" p={1} bgcolor="success.light" borderRadius={1} color="white">
              <Typography variant="h4" fontWeight="bold">
                {stats.online}
              </Typography>
              <Typography variant="caption">
                Online
              </Typography>
            </Box>
          </Box>

          <Box flex="1" minWidth="120px">
            <Box textAlign="center" p={1} bgcolor="warning.light" borderRadius={1} color="white">
              <Typography variant="h4" fontWeight="bold">
                {stats.pending}
              </Typography>              <Typography variant="caption">
                Pendente
              </Typography>
            </Box>
          </Box>

          <Box flex="1" minWidth="120px">
            <Box textAlign="center" p={1} bgcolor="error.light" borderRadius={1} color="white">
              <Typography variant="h4" fontWeight="bold">
                {stats.offline}
              </Typography>
              <Typography variant="caption">
                Offline
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Online Percentage Bar */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>            <Typography variant="body2" color="textSecondary">
              Percentual Online
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {getOnlinePercentage()}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getOnlinePercentage()} 
            color={getOnlinePercentage() > 80 ? 'success' : getOnlinePercentage() > 50 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Status Chips */}
        <Box display="flex" gap={1} flexWrap="wrap">          <Chip
            icon={<OnlineIcon />}
            label={`${stats.online} Online`}
            color={getStatusColor('online')}
            size="small"
          />
          <Chip
            icon={<PendingIcon />}
            label={`${stats.pending} Pendentes`}
            color={getStatusColor('pending')}
            size="small"
          />
          <Chip
            icon={<OfflineIcon />}
            label={`${stats.offline} Offline`}
            color={getStatusColor('offline')}
            size="small"
          />
          {stats.lastRefresh && (
            <Chip
              icon={<RefreshIcon />}
              label={`Última atualização: ${stats.lastRefresh.toLocaleTimeString()}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DeviceStats;
