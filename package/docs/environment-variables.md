# Configuration Options

The PumpFun API client supports flexible configuration with **configuration objects as the primary method** and environment variables as optional overrides for deployment scenarios.

## Recommended: Configuration Objects

The preferred way to configure the client is by passing a configuration object:

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

const client = new PumpFunAPIClient({
  baseURL: 'https://frontend-api-v3.pump.fun',
  timeout: 10000,
  wsURL: 'wss://api.pump.fun/ws',
  rateLimitConfig: {
    maxRequestsPerWindow: 60,
    windowMs: 60000
  },
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000
  },
  loggerConfig: {
    level: 'INFO',
    enableConsole: true,
    enableColors: true
  }
});
```

## Environment Variables (Optional Override)

For deployment scenarios where you need to override configuration without code changes, environment variables are supported. Configuration precedence: **defaults < explicit config < environment variables**.

**Note**: Environment variables are primarily useful for Docker, Kubernetes, CI/CD pipelines, and other deployment scenarios. For application development, prefer configuration objects.

## When to Use Environment Variables

Environment variables are ideal for:

- **Docker containers** - Runtime configuration without rebuilding images
- **Kubernetes deployments** - ConfigMaps and Secrets
- **CI/CD pipelines** - Environment-specific settings
- **Production deployments** - Override defaults without code changes
- **Multi-environment setups** - Different configs for staging/production

## Supported Environment Variables

### API Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUMPFUN_API_BASE_URL` | Base URL for the PumpFun API (matches working examples) | `https://frontend-api-v3.pump.fun` | `https://api.pump.fun` |
| `PUMPFUN_API_TIMEOUT` | Request timeout in milliseconds (matches working examples) | `10000` | `15000` |
| `TIMEOUT_MS` | Legacy timeout variable (for backward compatibility) | - | `10000` |

### WebSocket and Authentication Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUMPFUN_WS_URL` | WebSocket URL (from working examples, for future use) | - | `wss://api.pump.fun/ws` |
| `PUMPFUN_API_KEY` | API key (from working examples, for future use) | - | `your_api_key_here` |
| `PUMPFUN_AUTH_TOKEN` | Authentication token (from working examples, for future use) | - | `your_auth_token_here` |

### Logging Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUMPFUN_LOG_LEVEL` | Logging level | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `LOG_LEVEL` | Legacy log level variable | - | `info` |
| `PUMPFUN_LOG_CONSOLE` | Enable console logging | `true` | `true`, `false` |
| `PUMPFUN_LOG_COLORS` | Enable colored console output | `true` | `true`, `false` |
| `PUMPFUN_LOG_FILE` | Enable file logging | `false` | `true`, `false` |
| `PUMPFUN_LOG_FILE_PATH` | Log file path | - | `./logs/pumpfun.log` |
| `LOG_FILE_PATH` | Legacy log file path | - | `./logs/api.log` |
| `ENABLE_RESPONSE_LOGGING` | Legacy file logging flag | - | `true`, `false` |

### Rate Limiting Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUMPFUN_RATE_LIMIT_REQUESTS` | Max requests per time window | `60` | `120` |
| `MAX_REQUESTS_PER_MINUTE` | Legacy rate limit variable | - | `60` |
| `PUMPFUN_RATE_LIMIT_WINDOW_MS` | Time window duration in milliseconds | `60000` | `120000` |
| `PUMPFUN_RATE_LIMIT_RETRY_AFTER` | Enable retry-after header handling | `true` | `true`, `false` |
| `PUMPFUN_RATE_LIMIT_SLIDING_WINDOW` | Use sliding window algorithm | `true` | `true`, `false` |
| `PUMPFUN_RATE_LIMIT_BURST_PROTECTION` | Enable burst protection | `true` | `true`, `false` |
| `PUMPFUN_RATE_LIMIT_MAX_BURST` | Maximum burst size | `10` | `20` |
| `RATE_LIMIT_DELAY_MS` | Legacy delay variable | - | `1000` |

### Retry Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUMPFUN_RETRY_MAX_RETRIES` | Maximum retry attempts | `3` | `5` |
| `PUMPFUN_RETRY_BASE_DELAY` | Base delay in milliseconds | `1000` | `2000` |
| `PUMPFUN_RETRY_MAX_DELAY` | Maximum delay in milliseconds | `30000` | `60000` |
| `PUMPFUN_RETRY_BACKOFF_FACTOR` | Exponential backoff factor | `2` | `1.5` |

### Development Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node.js environment (from working examples) | - | `development`, `production` |
| `DEBUG` | Debug namespace for debugging (from working examples) | - | `pumpfun:*` |
| `ENABLE_NETWORK_ANALYSIS` | Enable network analysis (from working examples) | - | `true`, `false` |
| `ENABLE_RESPONSE_LOGGING` | Enable response logging (from working examples) | - | `true`, `false` |

## Usage Examples

### Recommended: Configuration Object Approach

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Primary method - explicit configuration
const client = new PumpFunAPIClient({
  baseURL: 'https://frontend-api-v3.pump.fun',
  timeout: 10000,
  rateLimitConfig: {
    maxRequestsPerWindow: 60,
    windowMs: 60000
  },
  loggerConfig: {
    level: 'INFO',
    enableConsole: true
  }
});
```

### Environment Variables as Optional Override

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Uses defaults, can be overridden by environment variables in deployment
const client = new PumpFunAPIClient();

// Environment variables will override defaults in production
// PUMPFUN_API_BASE_URL=https://prod-api.pump.fun
// PUMPFUN_RATE_LIMIT_REQUESTS=120
```

### Development Environment Setup (Optional)

For local development, you can optionally use environment files:

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your development settings:
```bash
# Development overrides (optional)
PUMPFUN_API_BASE_URL=https://dev-api.pump.fun
PUMPFUN_LOG_LEVEL=DEBUG
ENABLE_RESPONSE_LOGGING=true
NODE_ENV=development
DEBUG=pumpfun:*
```

3. Load environment variables in development:
```bash
# Using dotenv (development only)
dotenv -e .env.local node your-app.js

# Or in your development code
require('dotenv').config({ path: '.env.local' });
```

**Note**: Environment files are for development only. They are excluded from npm distribution.

### Docker Environment

```dockerfile
FROM node:18-alpine

# Set environment variables
ENV PUMPFUN_API_BASE_URL=https://api.pump.fun
ENV PUMPFUN_LOG_LEVEL=INFO
ENV PUMPFUN_RATE_LIMIT_REQUESTS=60

# Copy application code
COPY . /app
WORKDIR /app

# Install dependencies and run
RUN npm install
CMD ["npm", "start"]
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pumpfun-config
data:
  PUMPFUN_API_BASE_URL: "https://api.pump.fun"
  PUMPFUN_LOG_LEVEL: "INFO"
  PUMPFUN_RATE_LIMIT_REQUESTS: "60"
  PUMPFUN_API_TIMEOUT: "10000"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pumpfun-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: pumpfun-app:latest
        envFrom:
        - configMapRef:
            name: pumpfun-config
```

## Configuration Precedence

The client merges configuration in the following order (later values override earlier ones):

1. **Default values** built into the client
2. **Explicit configuration** passed to constructor
3. **Environment variables** (both `PUMPFUN_*` and legacy variables) - for deployment overrides

Example:
```typescript
// Default: timeout = 10000
// Explicit: { timeout: 20000 }
// Environment: PUMPFUN_API_TIMEOUT = 30000
// Result: timeout = 30000 (environment variables win for deployment overrides)
```

## Legacy Variable Support

For backward compatibility with existing setups, the client supports legacy environment variable names:

| Legacy Variable | Modern Equivalent |
|-----------------|-------------------|
| `TIMEOUT_MS` | `PUMPFUN_API_TIMEOUT` |
| `LOG_LEVEL` | `PUMPFUN_LOG_LEVEL` |
| `ENABLE_RESPONSE_LOGGING` | `PUMPFUN_LOG_FILE` |
| `LOG_FILE_PATH` | `PUMPFUN_LOG_FILE_PATH` |
| `MAX_REQUESTS_PER_MINUTE` | `PUMPFUN_RATE_LIMIT_REQUESTS` |
| `RATE_LIMIT_DELAY_MS` | (used for delay configuration) |

Modern `PUMPFUN_*` variables take precedence over legacy variables when both are set.

## Validation

The client validates all environment variables and will throw an error if:

- URLs are malformed
- Numeric values are out of acceptable ranges
- Invalid log levels are provided
- Required values are missing

Example validation errors:
```
Configuration validation failed:
  - Invalid baseURL format: not-a-url
  - Invalid timeout: 500. Must be a positive number.
  - Invalid log level: VERBOSE. Must be one of: DEBUG, INFO, WARN, ERROR, CRITICAL.
```

## Best Practices

1. **Use configuration objects** as the primary method for application code
2. **Reserve environment variables** for deployment scenarios and infrastructure configuration
3. **Set sensible defaults** in your configuration objects
4. **Use environment variables** for:
   - API endpoints (dev/staging/prod URLs)
   - Authentication credentials
   - Rate limiting adjustments for different environments
   - Debug/logging levels for development vs production
5. **Document environment variables** for deployment teams
6. **Never commit sensitive values** to version control (use proper secrets management)