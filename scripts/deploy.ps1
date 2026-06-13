# StellarFlow Vault Contract Deployment Script
# This script builds the smart contracts, deploys them to the Stellar network (Testnet by default),
# initializes their states, binds the reputation and factory contracts together,
# and outputs the deployed addresses for the frontend to consume.

Param(
    [string]$Network = "testnet",
    [string]$RpcUrl = "https://soroban-testnet.stellar.org",
    [string]$NetworkPassphrase = "Test SDF Network ; September 2015",
    [string]$DeployerName = "deployer",
    [string]$DeployerSecret = ""
)

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         STELLARFLOW VAULT DEPLOYMENT SCRIPT        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Verify Cargo & Stellar CLI installation
Write-Host "[1/6] Verifying tools..." -ForegroundColor Yellow
if (-not (Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    throw "Cargo is not installed or not in PATH. Please install Rust."
}
if (-not (Get-Command "stellar" -ErrorAction SilentlyContinue)) {
    throw "stellar-cli is not installed or not in PATH. Install via 'cargo install --locked stellar-cli'."
}

# 2. Compile and optimize contracts
Write-Host "[2/6] Compiling contracts..." -ForegroundColor Yellow
$env:CARGO_BUILD_JOBS=1
stellar contract build
if ($LASTEXITCODE -ne 0) {
    throw "Cargo compilation failed."
}
Write-Host "Contracts compiled successfully!" -ForegroundColor Green

# 3. Setup deployer account
Write-Host "[3/6] Setting up deployer account..." -ForegroundColor Yellow
# Add network configuration to stellar-cli
stellar network add --global $Network --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase

if ($DeployerSecret) {
    Write-Host "Importing secret key for identity '$DeployerName'..." -ForegroundColor Yellow
    stellar keys add $DeployerName --secret-key $DeployerSecret --force
} else {
    # Check if identity already exists
    $identities = stellar keys list
    if ($identities -notcontains $DeployerName) {
        Write-Host "Creating new identity '$DeployerName'..." -ForegroundColor Yellow
        stellar keys generate $DeployerName --network $Network
        Write-Host "Identity generated!" -ForegroundColor Green
    }
}

$DeployerAddress = stellar keys address $DeployerName
Write-Host "Deployer Address: $DeployerAddress" -ForegroundColor Green

# 4. Deploy Contracts
Write-Host "[4/6] Deploying smart contracts..." -ForegroundColor Yellow

# A. Deploy Reputation contract
Write-Host "Deploying Reputation contract..." -ForegroundColor Cyan
$ReputationId = stellar contract deploy --wasm target/wasm32v1-none/release/reputation.wasm --source $DeployerName --network $Network
Write-Host "Reputation Contract deployed: $ReputationId" -ForegroundColor Green

# B. Install/Upload Escrow WASM (to get its hash)
Write-Host "Uploading Escrow Wasm..." -ForegroundColor Cyan
$EscrowWasmHash = stellar contract install --wasm target/wasm32v1-none/release/escrow.wasm --source $DeployerName --network $Network
Write-Host "Escrow Wasm Hash: $EscrowWasmHash" -ForegroundColor Green

# C. Deploy Escrow Factory contract
Write-Host "Deploying Escrow Factory contract..." -ForegroundColor Cyan
$FactoryId = stellar contract deploy --wasm target/wasm32v1-none/release/escrow_factory.wasm --source $DeployerName --network $Network
Write-Host "Escrow Factory Contract deployed: $FactoryId" -ForegroundColor Green

# 5. Initialize contracts and perform bindings
Write-Host "[5/6] Initializing contracts and linking bindings..." -ForegroundColor Yellow

# A. Initialize Reputation Contract
Write-Host "Initializing Reputation Contract..." -ForegroundColor Cyan
stellar contract invoke --id $ReputationId --source $DeployerName --network $Network -- initialize --admin $DeployerAddress

# B. Initialize Escrow Factory Contract
Write-Host "Initializing Escrow Factory Contract..." -ForegroundColor Cyan
stellar contract invoke --id $FactoryId --source $DeployerName --network $Network -- initialize --admin $DeployerAddress --reputation_contract $ReputationId --escrow_wasm_hash $EscrowWasmHash

# C. Set Factory on Reputation Contract
Write-Host "Configuring Escrow Factory as whitelisted client inside Reputation..." -ForegroundColor Cyan
stellar contract invoke --id $ReputationId --source $DeployerName --network $Network -- set_factory --factory $FactoryId

Write-Host "Smart contracts configured successfully!" -ForegroundColor Green

# 6. Generate configuration and bindings for Frontend
Write-Host "[6/6] Writing deployment config for Frontend..." -ForegroundColor Yellow

$ConfigContent = @"
// Generated Deployment Configuration for StellarFlow Vault
export const DEPLOYED_CONFIG = {
  network: "$Network",
  rpcUrl: "$RpcUrl",
  networkPassphrase: "$NetworkPassphrase",
  deployerAddress: "$DeployerAddress",
  reputationAddress: "$ReputationId",
  factoryAddress: "$FactoryId",
  escrowWasmHash: "$EscrowWasmHash"
};
"@

$ConfigPath = Join-Path (Get-Location) "frontend/src/services/deployed_config.ts"
Set-Content -Path $ConfigPath -Value $ConfigContent
Write-Host "Config file written to: $ConfigPath" -ForegroundColor Green

Write-Host "====================================================" -ForegroundColor Green
Write-Host "Deployment completed successfully! Ready for launch." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
