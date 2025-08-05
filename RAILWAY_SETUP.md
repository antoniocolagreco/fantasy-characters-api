# Railway Deployment Setup Guide

Questo progetto è configurato per il deployment automatico su Railway tramite GitHub Actions.

## 🚂 Setup Railway

### 1. Crea account Railway

1. Vai su [railway.app](https://railway.app)
2. Registrati con GitHub
3. Crea un nuovo progetto

### 2. Installa Railway CLI (locale)

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Link project
railway link
```

### 3. Configura GitHub Secrets

Nel tuo repository GitHub, vai su **Settings** → **Secrets and variables** → **Actions**:

#### Required Secrets

- `RAILWAY_TOKEN`: Token da Railway Dashboard → Account Settings → Tokens

#### Optional Secrets (per features aggiuntive)

- `RAILWAY_STAGING_URL`: URL dell'app staging (per health check)
- `RAILWAY_PRODUCTION_URL`: URL dell'app production (per health check)
- `CODECOV_TOKEN`: Token per code coverage (opzionale)
- `SNYK_TOKEN`: Token per security scanning (opzionale)

### 4. Railway Project Setup

```bash
# Nel tuo progetto locale
railway login

# Crea ambiente staging
railway environment staging

# Crea ambiente production  
railway environment production

# Deploy iniziale
railway up
```

### 5. Environment Variables su Railway

Nel Dashboard Railway, configura:

#### Environment Variables (se necessarie)

- `NODE_ENV=production`
- `PORT=3000` (Railway lo gestisce automaticamente)
- Altre variabili specifiche del progetto

## 🔄 Deployment Flow

### Automatic Deployments

- **Push su `develop`** → Deploy su staging
- **Push su `main`** → Deploy su production

### Manual Deployment

```bash
# Deploy locale
railway up

# Deploy specifico environment
railway up --environment staging
railway up --environment production
```

## 🏥 Health Checks

Il sistema include health check automatici:

- Endpoint: `/api/health`
- Timeout: 60 secondi
- Auto-retry su failure

## 🐳 Docker Configuration

Il progetto usa Docker per deployment:

- **Dockerfile**: Production build
- **railway.toml**: Configurazione Railway
- **Health check**: Automatico su `/api/health`

## 📝 File di Configurazione

### railway.toml

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10

[experimental]
incrementalBuilds = true
```

## 🔧 Troubleshooting

### Deploy Failures

1. Controlla logs su Railway Dashboard
2. Verifica environment variables
3. Controlla Docker build

### GitHub Actions Failures

1. Verifica che `RAILWAY_TOKEN` sia configurato
2. Controlla che il progetto Railway sia correttamente linkato
3. Verifica permissions GitHub Actions

### Health Check Failures

1. Verifica che l'app risponda su `/api/health`
2. Controlla timeout configuration
3. Verifica PORT binding

## 📊 Monitoring

Railway fornisce:

- **Metrics**: CPU, Memory, Network
- **Logs**: Real-time application logs  
- **Uptime**: Monitoring automatico
- **Alerts**: Notifiche via email/Discord

## 💰 Pricing

Railway pricing:

- **Hobby**: $5/mese per progetto
- **Pro**: $20/mese con più risorse
- **Usage-based**: Pay per utilizzo

## 🔗 Links Utili

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [GitHub Actions Railway](https://docs.railway.app/deploy/github-actions)
