#!/bin/bash

# Script para testar a conectividade com o GenieACS
echo "=== GenieACS Connectivity Test ==="

# Verificar se o GenieACS está rodando na porta 7557
echo "Testing GenieACS NBI (REST API) on port 7557..."
curl -f -s -o /dev/null -w "%{http_code}" http://localhost:7557/devices || echo "Failed to connect to GenieACS NBI"

# Verificar se o GenieACS está rodando na porta 3000 (Web Interface)
echo "Testing GenieACS UI on port 3000..."
curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Failed to connect to GenieACS UI"

# Teste da API de devices
echo "Testing /devices endpoint..."
curl -X GET "http://localhost:7557/devices" \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  --fail --silent --show-error || echo "Failed to get devices"

echo "=== Test Complete ==="
