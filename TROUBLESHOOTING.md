# Troubleshooting - Error 405 Method Not Allowed

Este documento descreve como resolver o erro 405 Method Not Allowed na aplicação de gestão de dispositivos TR-069.

## Problema

A página de detalhes do dispositivo está retornando erro 405 Method Not Allowed e não consegue carregar os detalhes dos dispositivos.

## Possíveis Causas

1. **GenieACS não está rodando** - O servidor GenieACS não foi iniciado
2. **Problemas de proxy** - A configuração do nginx não está redirecionando corretamente
3. **Métodos HTTP incorretos** - A aplicação está usando métodos HTTP não suportados
4. **Problemas de autenticação** - Credenciais incorretas ou ausentes

## Soluções

### 1. Verificar se o GenieACS está rodando

#### Usando Docker Compose
```bash
# Navegar para o diretório do projeto
cd "c:\Users\carlo\OneDrive\Documents\0 - AplicativoFisio\ACS"

# Verificar status dos containers
docker-compose ps

# Iniciar os containers se não estiverem rodando
docker-compose up -d

# Verificar logs do GenieACS
docker-compose logs genieacs
```

#### Verificar conectividade manualmente
```powershell
# Executar o script de teste (Windows)
.\test-genieacs.ps1

# Ou testar manualmente com curl
curl http://localhost:7557/devices -u admin:admin
```

### 2. Verificar configuração da API

A aplicação foi configurada para:
- **Base URL**: `/api` (proxy para GenieACS)
- **GenieACS NBI**: `http://genieacs:7557` (dentro do Docker)
- **Credenciais**: admin/admin (padrão)

### 3. Testar em desenvolvimento

Para testar localmente sem Docker:

```bash
# Navegar para o frontend
cd frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm start
```

A aplicação inclui um componente de debug que aparece apenas em desenvolvimento. Acesse a página de dispositivos e expanda a seção "API Debug Tools" para testar as conexões.

### 4. Verificar configuração do nginx

O arquivo `frontend/nginx.conf` foi atualizado para:
- Suportar todos os métodos HTTP necessários
- Configurar CORS corretamente
- Tratar requisições OPTIONS (preflight)

### 5. Variáveis de ambiente

Verifique os arquivos de ambiente:
- `.env.development` - Para desenvolvimento local
- `.env.production` - Para produção com Docker

## Logs de Debug

A aplicação agora inclui logs detalhados. Abra as ferramentas de desenvolvedor do navegador (F12) e verifique:
1. **Console** - Para logs de requisições e erros
2. **Network** - Para ver o status das requisições HTTP

## Teste da API

Use o componente APIDebugComponent incluído na aplicação:
1. Acesse a página de dispositivos
2. Expanda "API Debug Tools" (apenas em desenvolvimento)
3. Clique em "Run API Tests"
4. Verifique os resultados

## Comandos Úteis

```bash
# Reiniciar todos os containers
docker-compose restart

# Rebuildar o frontend
docker-compose build frontend

# Ver logs em tempo real
docker-compose logs -f

# Parar todos os containers
docker-compose down

# Iniciar novamente
docker-compose up -d
```

## URLs de Teste

- **GenieACS UI**: http://localhost:4000
- **GenieACS API**: http://localhost:7557/devices
- **Frontend**: http://localhost:3001
- **API via Proxy**: http://localhost:3001/api/devices

## Se o problema persistir

1. Verifique se as portas 4000, 7557 e 3001 não estão sendo usadas por outros processos
2. Reinicie o Docker Desktop
3. Execute `docker-compose down` seguido de `docker-compose up -d --build`
4. Verifique os logs do GenieACS para erros específicos
