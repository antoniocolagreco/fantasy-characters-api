# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Fantasy
Characters API.

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl configured to access your cluster
- NGINX Ingress Controller (optional, for ingress)
- cert-manager (optional, for SSL certificates)

## Quick Start

1. **Create secrets** (replace with actual values):

```bash
kubectl create secret generic fantasy-characters-secrets \
  --from-literal=database-url="postgresql://username:password@postgres-service:5432/fantasy_characters_db" \
  --from-literal=jwt-secret="your-very-long-and-random-jwt-secret-here" \
  --from-literal=jwt-refresh-secret="your-very-long-and-random-refresh-secret-here" \
  --namespace=fantasy-characters
```

1. **Apply all manifests**:

```bash
kubectl apply -f k8s/
```

1. **Check deployment status**:

```bash
kubectl get all -n fantasy-characters
```

## Files Description

- `namespace.yaml`: Creates the fantasy-characters namespace
- `configmap.yaml`: Environment configuration (non-sensitive)
- `secrets.yaml`: Sensitive configuration (database, JWT secrets)
- `deployment.yaml`: Main application deployment with health checks
- `service.yaml`: Service definitions for the API
- `ingress.yaml`: Ingress configuration for external access
- `hpa.yaml`: Horizontal Pod Autoscaler for automatic scaling

## Health Checks

The deployment uses all four health endpoints:

- **Liveness Probe**: `/api/live` - Checks if pod should be restarted
- **Readiness Probe**: `/api/ready` - Checks if pod should receive traffic
- **Startup Probe**: `/api/healthz` - Gives extra time during startup

## Scaling

The HPA automatically scales between 2-10 replicas based on:

- CPU usage (target: 70%)
- Memory usage (target: 80%)

Manual scaling:

```bash
kubectl scale deployment fantasy-characters-api --replicas=5 -n fantasy-characters
```

## Monitoring

Check pod logs:

```bash
kubectl logs -f deployment/fantasy-characters-api -n fantasy-characters
```

Check health endpoints:

```bash
kubectl port-forward service/fantasy-characters-api-service 8080:80 -n fantasy-characters
curl http://localhost:8080/api/health
curl http://localhost:8080/api/healthz
curl http://localhost:8080/api/ready
curl http://localhost:8080/api/live
```

## Updating

Update with new image:

```bash
kubectl set image deployment/fantasy-characters-api api=fantasy-characters-api:v2.0.0 -n fantasy-characters
```

Check rollout status:

```bash
kubectl rollout status deployment/fantasy-characters-api -n fantasy-characters
```

Rollback if needed:

```bash
kubectl rollout undo deployment/fantasy-characters-api -n fantasy-characters
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod -l app=fantasy-characters-api -n fantasy-characters
kubectl logs -l app=fantasy-characters-api -n fantasy-characters
```

### Health checks failing

```bash
kubectl get events -n fantasy-characters
kubectl describe deployment fantasy-characters-api -n fantasy-characters
```

### Secrets issues

```bash
kubectl get secrets -n fantasy-characters
kubectl describe secret fantasy-characters-secrets -n fantasy-characters
```

## Clean Up

Remove all resources:

```bash
kubectl delete namespace fantasy-characters
```
