# Sistema de Auto-Refresh para Dispositivos TR-069

Este sistema permite atualizar automaticamente as informações de todos os dispositivos cadastrados no GenieACS a cada intervalo configurado (padrão: 10 minutos).

## Funcionalidades Implementadas

### 1. **API Functions (`api.ts`)**

#### `refreshAllDevices()`
- Atualiza informações básicas de todos os dispositivos
- Cria tasks do tipo `getParameterValues` para cada device
- Retorna estatísticas de sucesso/falha

#### `forceConnectionAllOffline()`
- Força tentativa de conexão para dispositivos offline
- Considera offline: dispositivos que não enviaram inform há mais de 10 minutos
- Cria tasks do tipo `connectionRequest`

#### `checkDeviceConnectivity(deviceId)`
- Verifica status de conectividade de um dispositivo específico
- Retorna informações detalhadas sobre último inform
- Calcula se está online/offline

### 2. **Hook de Auto-Refresh (`useAutoRefresh.ts`)**

#### Configurações Disponíveis:
```typescript
interface AutoRefreshConfig {
  enabled: boolean;                    // Ativar/desativar auto-refresh
  intervalMinutes: number;             // Intervalo em minutos (5, 10, 15, 30, 60)
  refreshOnlineDevices: boolean;       // Atualizar informações de todos os devices
  forceConnectionOfflineDevices: boolean; // Forçar conexão de devices offline
}
```

#### Status Retornado:
```typescript
interface AutoRefreshStatus {
  isRunning: boolean;        // Se está executando refresh no momento
  lastRefresh: Date | null;  // Última execução
  nextRefresh: Date | null;  // Próxima execução programada
  refreshCount: number;      // Contador de execuções
  lastResult: any;          // Resultado da última execução
  errors: string[];         // Lista de erros
}
```

#### Funções Disponíveis:
- `startAutoRefresh()` - Inicia o sistema automático
- `stopAutoRefresh()` - Para o sistema automático
- `manualRefresh()` - Executa refresh manual imediato

### 3. **Componente de Controle (`AutoRefreshControl.tsx`)**

Interface visual que permite:
- Visualizar status do auto-refresh em tempo real
- Configurar intervalos e opções
- Executar refresh manual
- Ver estatísticas da última execução
- Gerenciar erros

### 4. **Integração com DevicesPage**

- Componente de controle integrado na página principal
- Hook `useDevices` escuta eventos de auto-refresh
- Atualização automática da lista quando refresh completa

## Como Usar

### 1. **Uso Básico**
```typescript
import useAutoRefresh from '../hooks/useAutoRefresh';

const MyComponent = () => {
  const { status, manualRefresh } = useAutoRefresh();
  
  return (
    <div>
      <p>Status: {status.isRunning ? 'Running' : 'Idle'}</p>
      <button onClick={manualRefresh}>Refresh Now</button>
    </div>
  );
};
```

### 2. **Com Configurações Customizadas**
```typescript
const { status } = useAutoRefresh({
  enabled: true,
  intervalMinutes: 5,  // A cada 5 minutos
  refreshOnlineDevices: true,
  forceConnectionOfflineDevices: false  // Só atualizar, não forçar conexão
});
```

### 3. **Integração Manual**
```typescript
import { DevicesAPI } from '../services/api';

// Atualizar todos os dispositivos
const result = await DevicesAPI.refreshAllDevices();
console.log(`${result.data.successCount} devices refreshed`);

// Forçar conexão de dispositivos offline
const connectionResult = await DevicesAPI.forceConnectionAllOffline();
console.log(`${connectionResult.data.offlineDevices} offline devices found`);
```

## Eventos do Sistema

O sistema emite eventos customizados que podem ser escutados:

```typescript
// Escutar conclusão de auto-refresh
window.addEventListener('autoRefreshCompleted', (event) => {
  console.log('Auto-refresh completed:', event.detail);
});
```

## Fluxo de Execução

1. **Início do Auto-Refresh**
   - Configura intervalo baseado na configuração
   - Executa refresh inicial imediatamente
   - Agenda próximas execuções

2. **Execução do Refresh**
   - Se `refreshOnlineDevices` = true: Atualiza todos os devices
   - Se `forceConnectionOfflineDevices` = true: Força conexão dos offline
   - Registra estatísticas e erros
   - Emite evento `autoRefreshCompleted`

3. **Atualização da UI**
   - Hook `useDevices` escuta o evento
   - Recarrega lista de dispositivos automaticamente
   - Interface mostra status atualizado

## Logs e Debugging

O sistema gera logs detalhados no console:
- `🚀 Starting auto refresh every X minutes`
- `🔄 Starting automatic device refresh...`
- `📡 Refreshing all devices information...`
- `🔌 Forcing connection for offline devices...`
- `✅ Automatic device refresh completed successfully`
- `❌ Auto refresh error:` (em caso de erro)

## Configurações Recomendadas

### Para Ambiente de Produção:
```typescript
{
  enabled: true,
  intervalMinutes: 10,
  refreshOnlineDevices: true,
  forceConnectionOfflineDevices: true
}
```

### Para Ambiente de Desenvolvimento:
```typescript
{
  enabled: true,
  intervalMinutes: 5,  // Mais frequente para testes
  refreshOnlineDevices: true,
  forceConnectionOfflineDevices: false  // Evitar spam de connection requests
}
```

### Para Monitoramento Básico:
```typescript
{
  enabled: true,
  intervalMinutes: 30,  // Menos frequente
  refreshOnlineDevices: true,
  forceConnectionOfflineDevices: false  // Só monitora, não intervém
}
```

## Considerações de Performance

- O sistema executa as operações em paralelo para todos os dispositivos
- Connection requests só são enviados para dispositivos realmente offline
- Timeout configurado para 30 segundos nas requisições API
- Sistema continua funcionando mesmo se alguns dispositivos falharem

## Troubleshooting

### Auto-refresh não inicia:
- Verificar se `config.enabled = true`
- Verificar console para erros de API

### Dispositivos não atualizam:
- Verificar se GenieACS está respondendo
- Verificar credenciais de autenticação
- Verificar logs de erro no componente

### Performance lenta:
- Reduzir frequência (aumentar `intervalMinutes`)
- Desabilitar `forceConnectionOfflineDevices` se não necessário
- Verificar latência da rede com GenieACS
