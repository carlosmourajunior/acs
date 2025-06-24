import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DevicesAPI } from '../services/api';

const APIDebugComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runAPITests = async () => {
    setLoading(true);
    const results: any[] = [];

    // Test 1: Get devices list
    try {
      console.log('Testing: GET /devices');
      const devicesResponse = await DevicesAPI.getDevices();
      results.push({
        test: 'GET /devices',
        status: 'success',
        data: `Encontrados ${devicesResponse.data?.length || 0} dispositivos`,
        details: devicesResponse.data?.slice(0, 3) || []
      });
    } catch (error: any) {
      results.push({
        test: 'GET /devices',
        status: 'error',
        error: error.message,
        details: error.response?.data || error
      });
    }

    // Test 2: Get single device (if devices exist)
    if (results[0]?.status === 'success' && results[0]?.details?.length > 0) {
      try {
        const deviceId = results[0].details[0]._id;
        console.log('Testing: GET /devices/' + deviceId);
        const deviceResponse = await DevicesAPI.getDevice(deviceId);
        results.push({
          test: `GET /devices/${deviceId}`,
          status: 'success',
          data: 'Device details retrieved',
          details: deviceResponse.data
        });
      } catch (error: any) {
        results.push({
          test: 'GET /devices/{id}',
          status: 'error',
          error: error.message,
          details: error.response?.data || error
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ferramenta de Debug da API
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runAPITests} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        Executar Testes da API
      </Button>

      {testResults.map((result, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ mr: 2 }}>
                {result.test}
              </Typography>
              <Alert 
                severity={result.status === 'success' ? 'success' : 'error'}
                sx={{ flex: 1 }}
              >
                {result.status === 'success' ? result.data : result.error}
              </Alert>
            </Box>
            
            {result.details && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Detalhes:
                </Typography>
                <Paper sx={{ p: 1, backgroundColor: '#f5f5f5' }}>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    overflow: 'auto',
                    maxHeight: '300px' 
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </Paper>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {testResults.length === 0 && (
        <Alert severity="info">
          Clique em "Executar Testes da API" para verificar se a API está funcionando corretamente.
        </Alert>
      )}
    </Box>
  );
};

export default APIDebugComponent;
