import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]);

const ALLOWED_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'Accept',
  'Origin',
  'X-Requested-With',
];

function readConfiguredOrigins(): string[] {
  return (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildAllowedOriginSet(configuredOrigins: string[]): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);

  for (const origin of configuredOrigins) {
    if (origin !== '*') {
      origins.add(origin);
    }
  }

  return origins;
}

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  const configuredOrigins = readConfiguredOrigins();
  if (configuredOrigins.length === 0 || configuredOrigins.includes('*')) {
    return true;
  }

  return buildAllowedOriginSet(configuredOrigins).has(origin);
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin "${origin}" is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  };
}

export function buildCorsHeaders(origin?: string): Record<string, string> {
  if (!origin || !isOriginAllowed(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(','),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(','),
    Vary: 'Origin',
  };
}
