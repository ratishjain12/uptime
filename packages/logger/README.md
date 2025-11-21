# @uptime-cli/logger

Logger package for Uptime Monitor - send application logs to Uptime Monitor API and trigger alerts based on log severity.

## Installation

### npm

```bash
npm install @uptime-cli/logger
```

### yarn

```bash
yarn add @uptime-cli/logger
```

### pnpm

```bash
pnpm add @uptime-cli/logger
```

## Quick Start

### Basic Setup

```typescript
import { UptimeLogger } from '@uptime-cli/logger';

// Initialize with your service token from Uptime Monitor dashboard
const logger = new UptimeLogger({
  token: 'upt_abc123...xyz789', // Get this from your monitor dashboard
  serviceName: 'user-service'
});

// Log at different levels
logger.error('Database connection failed');
logger.warn('High memory usage detected');
logger.info('User logged in', { userId: '123' });
logger.debug('Processing request', { requestId: 'req-456' });
```

### Getting Your Service Token

1. Sign in to your Uptime Monitor dashboard
2. Create a new **App Logger** monitor
3. Copy the service token displayed on the monitor card
4. Use this token when initializing the logger

### Environment Variables

```typescript
import { UptimeLogger } from '@uptime-cli/logger';

const logger = new UptimeLogger({
  token: process.env.UPTIME_SERVICE_TOKEN, // Required
  serviceName: process.env.SERVICE_NAME || 'my-service',
  baseUrl: process.env.UPTIME_API_URL, // Optional, defaults to current origin
});
```

Set in your `.env` file:

```bash
UPTIME_SERVICE_TOKEN=upt_your_token_here
UPTIME_API_URL=https://uptime-zx42.vercel.app
SERVICE_NAME=user-service
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

### Express.js Example

```typescript
import express from 'express';
import { UptimeLogger } from '@uptime-cli/logger';

const logger = new UptimeLogger({
  token: process.env.UPTIME_SERVICE_TOKEN,
  serviceName: 'express-api',
  baseUrl: process.env.UPTIME_API_URL
});

const app = express();

// Middleware to create request-scoped logger
app.use((req, res, next) => {
  const requestLogger = logger.child({ 
    requestId: req.id || crypto.randomUUID(),
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  req.logger = requestLogger;
  next();
});

// Example route with logging
app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    req.logger.info('User created', { userId: user.id });
    res.json(user);
  } catch (error) {
    req.logger.error('Failed to create user', { 
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Next.js API Route Example

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UptimeLogger } from '@uptime-cli/logger';

const logger = new UptimeLogger({
  token: process.env.UPTIME_SERVICE_TOKEN!,
  serviceName: 'nextjs-api'
});

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({
    path: request.nextUrl.pathname,
    method: 'POST'
  });

  try {
    const body = await request.json();
    const user = await createUser(body);
    
    requestLogger.info('User created', { userId: user.id });
    return NextResponse.json(user);
  } catch (error) {
    requestLogger.error('Failed to create user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Node.js Background Job Example

```typescript
import { UptimeLogger } from '@uptime-cli/logger';

const logger = new UptimeLogger({
  token: process.env.UPTIME_SERVICE_TOKEN!,
  serviceName: 'payment-processor'
});

async function processPayments() {
  const jobLogger = logger.child({ jobId: crypto.randomUUID() });
  
  try {
    jobLogger.info('Starting payment processing job');
    const payments = await getPendingPayments();
    
    for (const payment of payments) {
      try {
        await processPayment(payment);
        jobLogger.info('Payment processed', { paymentId: payment.id });
      } catch (error) {
        jobLogger.error('Payment processing failed', {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    jobLogger.info('Payment processing job completed', {
      processed: payments.length
    });
  } catch (error) {
    jobLogger.error('Payment job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
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

