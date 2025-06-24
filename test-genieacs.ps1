# PowerShell script para testar a conectividade com o GenieACS
Write-Host "=== GenieACS Connectivity Test ===" -ForegroundColor Green

# Função para testar conectividade HTTP
function Test-HttpConnection {
    param(
        [string]$Url,
        [string]$Description
    )
    
    try {
        Write-Host "Testing $Description..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        Write-Host "✓ $Description - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ $Description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verificar se o GenieACS está rodando na porta 7557 (NBI - REST API)
$nbiUrl = "http://localhost:7557/devices"
Test-HttpConnection -Url $nbiUrl -Description "GenieACS NBI (REST API) on port 7557"

# Verificar se o GenieACS está rodando na porta 4000 (Web Interface)
$uiUrl = "http://localhost:4000"
Test-HttpConnection -Url $uiUrl -Description "GenieACS UI on port 4000"

# Teste da API de devices com autenticação
try {
    Write-Host "Testing /devices endpoint with authentication..." -ForegroundColor Yellow
    $credential = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("admin:admin"))
    $headers = @{
        "Authorization" = "Basic $credential"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $nbiUrl -Method GET -Headers $headers -TimeoutSec 10 -UseBasicParsing
    $devices = $response.Content | ConvertFrom-Json
    Write-Host "✓ Successfully retrieved $($devices.Count) devices" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to get devices with authentication: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green

# Verificar se o Docker está rodando
try {
    Write-Host "`nChecking Docker containers..." -ForegroundColor Yellow
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host $containers
}
catch {
    Write-Host "Docker is not running or not installed" -ForegroundColor Red
}
