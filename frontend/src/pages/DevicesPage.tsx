import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Alert, 
  Snackbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import APIDebugComponent from '../components/APIDebugComponent';
import AutoRefreshControl from '../components/AutoRefreshControl';
import DeviceStats from '../components/DeviceStats';
import { useDevices } from '../hooks/useDevices';

const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { devices, loading, error, refresh, deleteDevice } = useDevices();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Devices loaded:', devices);
  }, [devices]);

  useEffect(() => {
    if (error) {
      console.error('Error loading devices:', error);
    }
  }, [error]);

  const handleViewDevice = (device: any) => {
    console.log('Viewing device:', device);
    navigate(`/devices/${device._id}`);
  };

  const handleEditDevice = (device: any) => {
    console.log('Editing device:', device);
    navigate(`/devices/${device._id}/edit`);
  };

  const handleDeleteClick = (device: any) => {
    console.log('Preparing to delete device:', device);
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;

    try {
      console.log('Deleting device:', deviceToDelete);
      await deleteDevice(deviceToDelete._id);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (err) {
      console.error('Error deleting device:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeviceToDelete(null);
  };  const columns = [
    { 
      id: 'serialNumber', 
      label: 'Serial Number', 
      minWidth: 170 
    },
    { 
      id: 'manufacturer', 
      label: 'Manufacturer', 
      minWidth: 130 
    },
    { 
      id: 'model', 
      label: 'Model', 
      minWidth: 130 
    },
    { 
      id: 'status', 
      label: 'Status', 
      minWidth: 100,
      align: 'center' as const
    },
    {
      id: 'lastContact',
      label: 'Last Contact',
      minWidth: 170
    },
    { 
      id: 'softwareVersion', 
      label: 'Software Version', 
      minWidth: 170 
    },    { 
      id: 'ipAddress', 
      label: 'IP Address', 
      minWidth: 130 
    }
  ];

  return (    <Box p={3}>      <Header
        title="Devices"
        subtitle="Manage your TR-069 devices"      />
      
      {/* Device Statistics */}
      <DeviceStats devices={devices} loading={loading} />
      
      {/* Auto Refresh Control */}
      <AutoRefreshControl />
      
      <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refresh}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/devices/new')}
        >
          Add Device
        </Button>
      </Box>
        {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setDeleteError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Debug section for development */}
      {process.env.NODE_ENV === 'development' && (
        <Accordion sx={{ mb: 2 }}>          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>API Debug Tools</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <APIDebugComponent />
          </AccordionDetails>
        </Accordion>
      )}

      {loading ? (        <Box display="flex" flexDirection="column" alignItems="center" p={3}>
          <CircularProgress sx={{ mb: 2 }} />          <Typography variant="body2" color="text.secondary">
            Loading devices...
          </Typography>
        </Box>
      ) : devices.length === 0 ? (        <Alert severity="info">
          No devices found. Add a device to get started.
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={devices}
          onView={handleViewDevice}
          onEdit={handleEditDevice}
          onDelete={handleDeleteClick}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete device{' '}
            {deviceToDelete?.serialNumber}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={deleteError !== null}
        autoHideDuration={6000}
        onClose={() => setDeleteError(null)}
        message={deleteError}
      />

      {process.env.NODE_ENV === 'development' && (
        <Accordion defaultExpanded>          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>API Debug Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <APIDebugComponent />
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default DevicesPage;
