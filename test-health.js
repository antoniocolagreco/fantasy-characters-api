// Quick test to see what getHealthStatus returns
import { getHealthStatus } from './src/health/health.service.js'

console.log('Testing health service...')
try {
  const health = await getHealthStatus()
  console.log('Health data:', JSON.stringify(health, null, 2))
} catch (error) {
  console.error('Error:', error)
}
