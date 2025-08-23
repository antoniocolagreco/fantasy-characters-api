# Kubernetes Configuration

## Database Architecture

The application uses PostgreSQL as the database for all deployments:

- **Development**: PostgreSQL in Docker container via docker-compose
- **Testing**: PostgreSQL with dedicated test database
- **Production**: Managed PostgreSQL service (AWS RDS, Google Cloud SQL, or self-hosted cluster)

## Health Check Strategy

The application provides four health endpoints for Kubernetes deployment:

1. **`/api/health`** - Standard health check
2. **`/api/healthz`** - Kubernetes-style health check
3. **`/api/ready`** - Readiness probe (checks if ready to receive traffic)
4. **`/api/live`** - Liveness probe (checks if pod should be restarted)

## Kubernetes Manifests

Essential files in `k8s/` directory:

- `namespace.yaml` - Creates fantasy-characters namespace
- `deployment.yaml` - Main application deployment with health checks
- `service.yaml` - Service definition for the API
- `configmap.yaml` - Environment configuration
- `secrets.yaml` - Sensitive data (database, JWT secrets)
- `hpa.yaml` - Horizontal Pod Autoscaler (2-10 replicas)
- `ingress.yaml` - External access with SSL/TLS

## Basic Deployment

### Create Secrets

```bash
# Create secrets (replace with actual values)
kubectl create secret generic fantasy-characters-secrets \
  --from-literal=database-url="postgresql://username:password@postgres-service:5432/fantasy_characters_db" \
  --from-literal=jwt-secret="your-jwt-secret" \
  --namespace=fantasy-characters
```

### Deploy Application

```bash
# Deploy all manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n fantasy-characters
```

## Health Check Configuration

The deployment uses:

- **Liveness Probe**: `/api/live` - Restarts pod if failing
- **Readiness Probe**: `/api/ready` - Stops traffic if failing
- **Startup Probe**: `/api/healthz` - Extra time during startup

### Example Probe Configuration

```yaml
livenessProbe:
  httpGet:
    path: /api/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /api/healthz
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30
```

## Horizontal Pod Autoscaler

Automatic scaling configuration:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fantasy-characters-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fantasy-characters-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Monitoring and Observability

### Logging

- **Structured Logging**: JSON format with Pino
- **Log Aggregation**: Centralized logging system
- **Log Levels**: Appropriate log levels for different environments

### Metrics

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, network usage
- **Health Metrics**: Health check success/failure rates

### Alerting

- **Pod Failures**: Alert on pod restart loops
- **Resource Usage**: Alert on high CPU/memory usage
- **Health Check Failures**: Alert on persistent health check failures
- **Performance Degradation**: Alert on response time increases
