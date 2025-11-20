# @uptime/logger

Logger package for Uptime Monitor - send application logs to Uptime Monitor API and trigger alerts based on log severity.

## Installation

```bash
npm install @uptime/logger
```

## Quick Start

```typescript
import { UptimeLogger } from '@uptime/logger';

// Initialize with your service token from Uptime Monitor dashboard
const logger = new UptimeLogger({
  token: 'upt_abc123...xyz789',
  serviceName: 'user-service'
});

// Log at different levels
logger.error('Database connection failed');
logger.warn('High memory usage detected');
logger.info('User logged in', { userId: '123' });
logger.debug('Processing request', { requestId: 'req-456' });
```

## Configuration

### Basic Configuration

```typescript
const logger = new UptimeLogger({
  token: 'your-service-token',  // Required: Get from Uptime Monitor dashboard
  serviceName: 'my-service',     // Optional: Service identifier
  baseUrl: 'https://api.example.com', // Optional: API base URL
  enabled: true,                 // Optional: Enable/disable logging
  environment: 'production'      // Optional: Environment identifier
});
```

### Environment Variables

You can use environment variables for configuration:

```typescript
const logger = new UptimeLogger({
  token: process.env.UPTIME_TOKEN,
  baseUrl: process.env.UPTIME_API_URL, // Optional, defaults to current origin
});
```

## Usage Examples

### Basic Logging

```typescript
logger.error('Payment processing failed');
logger.warn('API rate limit approaching');
logger.info('Cache updated successfully');
logger.debug('Query executed', { query: 'SELECT * FROM users' });
```

### With Metadata

```typescript
logger.error('Transaction failed', {
  transactionId: 'txn-123',
  amount: 100.50,
  userId: 'user-456'
});
```

### Child Loggers (Context)

Create child loggers with persistent context:

```typescript
const requestLogger = logger.child({ 
  requestId: 'req-789',
  userId: 'user-123'
});

// All logs from requestLogger will include requestId and userId
requestLogger.error('Validation failed');
requestLogger.info('Request completed');
```

### Express Middleware Example

```typescript
import express from 'express';
import { UptimeLogger } from '@uptime/logger';

const logger = new UptimeLogger({
  token: process.env.UPTIME_TOKEN,
  serviceName: 'express-api'
});

const app = express();

app.use((req, res, next) => {
  const requestLogger = logger.child({ 
    requestId: req.id,
    path: req.path,
    method: req.method
  });
  
  req.logger = requestLogger;
  next();
});

app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    req.logger.info('User created', { userId: user.id });
    res.json(user);
  } catch (error) {
    req.logger.error('Failed to create user', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Error Handling

```typescript
try {
  await processPayment();
  logger.info('Payment processed successfully');
} catch (error) {
  logger.error('Payment processing failed', {
    error: error.message,
    stack: error.stack,
    orderId: order.id
  });
}
```

## API Reference

### UptimeLogger

#### Constructor

```typescript
new UptimeLogger(config: LoggerConfig)
```

**Config Options:**
- `token` (required): Service token from Uptime Monitor dashboard
- `serviceName` (optional): Service identifier
- `baseUrl` (optional): API base URL (defaults to `UPTIME_API_URL` env var or current origin)
- `enabled` (optional): Enable/disable logging (default: `true`)
- `environment` (optional): Environment identifier

#### Methods

- `error(message: string, metadata?: LogMetadata): void` - Log error level
- `warn(message: string, metadata?: LogMetadata): void` - Log warning level
- `info(message: string, metadata?: LogMetadata): void` - Log info level
- `debug(message: string, metadata?: LogMetadata): void` - Log debug level
- `child(context: LogMetadata): UptimeLogger` - Create child logger with context

## Log Levels

Log levels are ordered by severity:
- `debug` (lowest) - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages
- `error` (highest) - Error messages

Configure alert thresholds in Uptime Monitor dashboard to control which log levels trigger alerts.

## How It Works

1. **Initialize** logger with your service token
2. **Log messages** using `error()`, `warn()`, `info()`, or `debug()` methods
3. **Logs are sent** to `/api/logs/ingest` endpoint
4. **Alerts trigger** when log level meets your configured threshold
5. **Notifications** are sent via email, Slack, or webhooks

## Notes

- Logs are sent asynchronously (non-blocking)
- Failed API calls are logged to console but don't throw errors
- Child loggers merge context with individual log metadata
- All logs include automatic timestamps

## License

MIT

