param(
  [string]$resourceGroup = "humanaize",
  [string]$location      = "eastus",
  [string]$planName      = "humanaize-plan",
  [string]$webAppName    = "humanaize-app",
  [string]$envFile       = ".env.production",   # path relative to project root
  [switch]$infraOnly,    # provision Azure resources only, skip build/deploy
  [switch]$deployOnly,   # skip infra provisioning, just build and redeploy
  [switch]$skipEnv       # skip pushing env vars to Azure (useful if already set)
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path "$PSScriptRoot\.."

# ── 1. Provision Azure infrastructure ────────────────────────────────────────
if (-not $deployOnly) {
  Write-Host "`n==> Creating resource group '$resourceGroup' in $location..."
  az group create --name $resourceGroup --location $location

  Write-Host "`n==> Creating Linux App Service plan '$planName' (B1)..."
  az appservice plan create --name $planName --resource-group $resourceGroup --is-linux --sku B1

  Write-Host "`n==> Creating web app '$webAppName' (Node 20 LTS)..."
  az webapp create --resource-group $resourceGroup --plan $planName --name $webAppName --runtime "NODE|20-lts"

  Write-Host "`n==> Configuring base app settings..."
  az webapp config appsettings set --resource-group $resourceGroup --name $webAppName --settings `
    SCM_DO_BUILD_DURING_DEPLOYMENT=false `
    WEBSITE_NODE_DEFAULT_VERSION=20.0 `
    NODE_ENV=production

  Write-Host "`n==> Setting startup command..."
  az webapp config set --resource-group $resourceGroup --name $webAppName --startup-file "node dist/index.js"
}

if ($infraOnly) {
  Write-Host "`nInfra-only flag set — skipping env vars, build, and deploy."
  exit 0
}

# ── 2. Push environment variables to Azure ────────────────────────────────────
# Required variables (from server/_core/env.ts):
#   VITE_APP_ID                   — OAuth app ID
#   JWT_SECRET                    — session cookie signing secret (strong random string)
#   AZURE_SQL_CONNECTION_STRING   — e.g. Server=tcp:...;Database=...;User=...;Password=...
#   OAUTH_SERVER_URL              — URL of your OAuth provider
#   OWNER_OPEN_ID                 — owner's openId value from the OAuth provider
#   AZURE_STORAGE_ACCOUNT_NAME    — Azure Blob Storage account name
#   AZURE_STORAGE_CONTAINER_NAME  — Azure Blob Storage container name
#   AZURE_STORAGE_ACCOUNT_KEY     — Azure Blob Storage account key
#   BUILT_IN_FORGE_API_URL        — Forge/AI API base URL (optional)
#   BUILT_IN_FORGE_API_KEY        — Forge/AI API key (optional)
if (-not $skipEnv) {
  $envFilePath = Join-Path $projectRoot $envFile
  if (-not (Test-Path $envFilePath)) {
    Write-Error @"
Missing env file: $envFilePath

Create it with the required secrets (one per line, KEY=value).
See comments in this script for the full list. Example:

  VITE_APP_ID=your-app-id
  JWT_SECRET=a-long-random-secret
  AZURE_SQL_CONNECTION_STRING=Server=tcp:myserver.database.windows.net,1433;...
  OAUTH_SERVER_URL=https://your-oauth-provider.com
  OWNER_OPEN_ID=your-open-id
  AZURE_STORAGE_ACCOUNT_NAME=myaccount
  AZURE_STORAGE_CONTAINER_NAME=mycontainer
  AZURE_STORAGE_ACCOUNT_KEY=base64key==
  BUILT_IN_FORGE_API_URL=https://forge-api-url
  BUILT_IN_FORGE_API_KEY=your-forge-key

Do NOT commit .env.production to git.
"@
    exit 1
  }

  Write-Host "`n==> Reading env vars from $envFilePath ..."
  # Parse KEY=value lines (skip blank lines and comments)
  $settings = Get-Content $envFilePath |
    Where-Object { $_ -match '^\s*[^#\s]' -and $_ -match '=' } |
    ForEach-Object { $_.Trim() }

  if ($settings.Count -eq 0) {
    Write-Warning "No settings found in $envFilePath — skipping env var push."
  } else {
    Write-Host "==> Pushing $($settings.Count) env vars to Azure App Service..."
    az webapp config appsettings set `
      --resource-group $resourceGroup `
      --name $webAppName `
      --settings @settings
    Write-Host "    Done."
  }
}

# ── 3. Build the app locally ──────────────────────────────────────────────────
Write-Host "`n==> Installing dependencies..."
Push-Location $projectRoot
pnpm install

Write-Host "`n==> Building (Vite client + esbuild server)..."
pnpm run build

# ── 4. Package for deployment ─────────────────────────────────────────────────
# The server bundle is fully self-contained (esbuild bundles all deps).
# Only dist/ needs to ship — no node_modules required at runtime.
$stagingDir = Join-Path $projectRoot ".deploy_staging"
$zipPath    = Join-Path $projectRoot "deploy.zip"

Write-Host "`n==> Staging deployment package..."
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Copy-Item -Path (Join-Path $projectRoot "dist") -Destination (Join-Path $stagingDir "dist") -Recurse

# Minimal package.json so Azure knows the start command.
$startPkg = @{ name = "humanaize-app"; version = "1.0.0"; type = "module"; scripts = @{ start = "node dist/index.js" } }
$startPkg | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $stagingDir "package.json")

Write-Host "==> Creating deploy.zip..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath
Remove-Item $stagingDir -Recurse -Force

# ── 5. Clear stale Oryx cache on Azure ───────────────────────────────────────
# Oryx caches a node_modules.tar.gz from previous deployments which overrides
# our bundle and causes ERR_MODULE_NOT_FOUND on startup. Delete it via Kudu.
Write-Host "`n==> Clearing stale node_modules cache on Azure..."
$kuduBase = "https://$webAppName.scm.azurewebsites.net"
$creds = az webapp deployment list-publishing-credentials `
  --resource-group $resourceGroup --name $webAppName `
  --query "[publishingUserName,publishingPassword]" -o tsv 2>$null
if ($creds) {
  $parts = $creds -split "`t"
  $user = $parts[0]; $pass = $parts[1]
  $b64  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
  $headers = @{ Authorization = "Basic $b64" }
  # Delete stale cached files if they exist
  foreach ($f in @("node_modules.tar.gz", "oryx-manifest.toml")) {
    try {
      Invoke-RestMethod -Method Delete -Uri "$kuduBase/api/vfs/site/wwwroot/$f" -Headers $headers -ErrorAction SilentlyContinue | Out-Null
      Write-Host "    Deleted $f"
    } catch { Write-Host "    $f not present (ok)" }
  }
} else {
  Write-Warning "Could not retrieve Kudu credentials — skipping cache clear."
}

# ── 6. Deploy to Azure ────────────────────────────────────────────────────────
Write-Host "`n==> Deploying zip to '$webAppName'..."
az webapp deploy `
  --resource-group $resourceGroup `
  --name $webAppName `
  --src-path $zipPath `
  --type zip

Pop-Location  # back to original dir

Write-Host "`n==> Deployment complete!"
Write-Host "    URL:       https://$webAppName.azurewebsites.net"
Write-Host "    Tail logs: az webapp log tail --resource-group $resourceGroup --name $webAppName"
