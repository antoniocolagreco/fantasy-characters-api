import { config } from '../src/config/environment';

describe('Environment Configuration', () => {
  test('should load configuration values', () => {
    expect(config).toBeDefined();
    expect(config.NODE_ENV).toBeDefined();
    expect(config.PORT).toBeGreaterThan(0);
    expect(config.API_PREFIX).toBe('/api');
  });

  test('should have valid default values', () => {
    expect(config.HEALTH_CHECK_ENABLED).toBe(true);
    expect(config.LOG_LEVEL).toBeDefined();
    expect(config.RATE_LIMIT_MAX).toBeGreaterThan(0);
  });
});
