import { DevicesAPI } from '../services/api';

/**
 * Exemplo de uso das funções de auto-refresh do sistema
 * Este arquivo demonstra como usar as APIs programaticamente
 */

// Exemplo 1: Atualizar todos os dispositivos manualmente
export const manualRefreshAllDevices = async () => {
  try {
    console.log('🔄 Iniciando atualização manual de todos os dispositivos...');
    
    const result = await DevicesAPI.refreshAllDevices();
    
    console.log('✅ Resultado da atualização:', {
      totalDevices: result.data.totalDevices,
      successful: result.data.successCount,
      failed: result.data.failureCount
    });
    
    return result.data;
  } catch (error) {
    console.error('❌ Erro na atualização manual:', error);
    throw error;
  }
};

// Exemplo 2: Forçar conexão apenas de dispositivos offline
export const forceReconnectOfflineDevices = async () => {
  try {
    console.log('🔌 Forçando reconexão de dispositivos offline...');
    
    const result = await DevicesAPI.forceConnectionAllOffline();
    
    console.log('✅ Resultado da reconexão:', {
      totalDevices: result.data.totalDevices,
      offlineDevices: result.data.offlineDevices,
      reconnectionAttempts: result.data.successCount,
      failed: result.data.failureCount
    });
    
    return result.data;
  } catch (error) {
    console.error('❌ Erro na reconexão:', error);
    throw error;
  }
};

// Exemplo 3: Verificar conectividade de um dispositivo específico
export const checkSpecificDeviceConnectivity = async (deviceId: string) => {
  try {
    console.log(`🔍 Verificando conectividade do dispositivo ${deviceId}...`);
    
    const result = await DevicesAPI.checkDeviceConnectivity(deviceId);
    
    console.log('📊 Status de conectividade:', {
      deviceId,
      isOnline: result.data.isOnline,
      lastInform: result.data.lastInformFormatted,
      timeSinceLastInform: `${Math.round(result.data.lastInformAgo / 60000)} minutos`
    });
    
    return result.data;
  } catch (error) {
    console.error('❌ Erro ao verificar conectividade:', error);
    throw error;
  }
};

// Exemplo 4: Atualizar um dispositivo específico
export const refreshSpecificDevice = async (deviceId: string) => {
  try {
    console.log(`🔄 Atualizando dispositivo específico ${deviceId}...`);
    
    const result = await DevicesAPI.refreshDeviceStatus(deviceId);
    
    console.log('✅ Dispositivo atualizado com sucesso');
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao atualizar dispositivo:', error);
    throw error;
  }
};

// Exemplo 5: Forçar conexão de um dispositivo específico
export const forceSpecificDeviceConnection = async (deviceId: string) => {
  try {
    console.log(`🔌 Forçando conexão do dispositivo ${deviceId}...`);
    
    const result = await DevicesAPI.forceConnection(deviceId);
    
    console.log('✅ Solicitação de conexão enviada');
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao forçar conexão:', error);
    throw error;
  }
};

// Exemplo 6: Operação completa de refresh (recomendado para uso em produção)
export const performCompleteRefresh = async () => {
  console.log('🚀 Iniciando operação completa de refresh...');
  
  const results = {
    refreshAll: null as any,
    forceConnection: null as any,
    errors: [] as string[]
  };
  
  try {
    // Passo 1: Atualizar informações de todos os dispositivos
    console.log('📡 Passo 1: Atualizando informações dos dispositivos...');
    results.refreshAll = await DevicesAPI.refreshAllDevices();
    console.log(`✅ Passo 1 concluído: ${results.refreshAll.data.successCount}/${results.refreshAll.data.totalDevices} dispositivos atualizados`);
    
    // Aguardar um pouco antes do próximo passo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Passo 2: Forçar conexão de dispositivos offline
    console.log('🔌 Passo 2: Forçando reconexão de dispositivos offline...');
    results.forceConnection = await DevicesAPI.forceConnectionAllOffline();
    console.log(`✅ Passo 2 concluído: ${results.forceConnection.data.successCount}/${results.forceConnection.data.offlineDevices} tentativas de reconexão enviadas`);
    
  } catch (error) {
    const errorMsg = `Erro durante refresh completo: ${error}`;
    console.error('❌', errorMsg);
    results.errors.push(errorMsg);
  }
  
  console.log('🏁 Operação completa de refresh finalizada:', results);
  return results;
};

// Exemplo 7: Monitorar tasks de um dispositivo
export const monitorDeviceTasks = async (deviceId: string) => {
  try {
    console.log(`📋 Monitorando tasks do dispositivo ${deviceId}...`);
    
    const result = await DevicesAPI.getDeviceTasks(deviceId);
    
    console.log('📊 Tasks encontradas:', {
      deviceId,
      totalTasks: result.data.length,
      tasks: result.data.map((task: any) => ({
        id: task._id,
        name: task.name,
        timestamp: task.timestamp
      }))
    });
    
    return result.data;
  } catch (error) {
    console.error('❌ Erro ao monitorar tasks:', error);
    throw error;
  }
};

// Exemplo 8: Implementar retry automático para dispositivos que falharam
export const retryFailedDevices = async (failedDeviceIds: string[]) => {
  console.log(`🔄 Tentando novamente dispositivos que falharam: ${failedDeviceIds.length} dispositivos`);
  
  const retryResults = [];
  
  for (const deviceId of failedDeviceIds) {
    try {
      console.log(`🔄 Tentativa de retry para dispositivo ${deviceId}...`);
      
      // Primeiro tenta forçar conexão
      await DevicesAPI.forceConnection(deviceId);
      
      // Aguarda um pouco
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Depois tenta atualizar
      await DevicesAPI.refreshDeviceStatus(deviceId);
      
      retryResults.push({ deviceId, success: true });
      console.log(`✅ Retry bem-sucedido para ${deviceId}`);
      
    } catch (error) {
      retryResults.push({ deviceId, success: false, error: (error instanceof Error ? error.message : String(error)) });
      console.error(`❌ Retry falhou para ${deviceId}:`, error);
    }
  }
  
  const successCount = retryResults.filter(r => r.success).length;
  console.log(`🏁 Retry concluído: ${successCount}/${failedDeviceIds.length} dispositivos recuperados`);
  
  return retryResults;
};

export default {
  manualRefreshAllDevices,
  forceReconnectOfflineDevices,
  checkSpecificDeviceConnectivity,
  refreshSpecificDevice,
  forceSpecificDeviceConnection,
  performCompleteRefresh,
  monitorDeviceTasks,
  retryFailedDevices
};
