/**
 * PumpFun API Authentication TypeScript Interfaces
 *
 * Complete TypeScript interface definitions for authentication-related structures
 * including request headers, tokens, credentials, and authentication flows.
 *
 * Created: 2025-10-11
 * Purpose: T024 - Create authentication interfaces for auth-related structures
 */

/**
 * Authentication Types
 * Supported authentication methods for PumpFun API
 */
export type AuthenticationType =
  | 'NONE'
  | 'BEARER_TOKEN'
  | 'API_KEY'
  | 'SESSION_COOKIE'
  | 'JWT'
  | 'OAUTH2'
  | 'CUSTOM';

/**
 * Token Location Types
 * Where authentication tokens can be placed in requests
 */
export type TokenLocation =
  | 'HEADER'
  | 'QUERY_PARAM'
  | 'COOKIE'
  | 'BODY'
  | 'URL';

/**
 * Authentication Token Types
 * Different types of authentication tokens
 */
export type TokenType =
  | 'BEARER'
  | 'API_KEY'
  | 'SESSION'
  | 'JWT'
  | 'OAUTH_ACCESS_TOKEN'
  | 'OAUTH_REFRESH_TOKEN';

/**
 * Authentication Credentials Interface
 * Base interface for authentication credentials
 */
export interface AuthCredentials {
  /** Authentication type */
  type: AuthenticationType;

  /** Authentication token/credential */
  token: string;

  /** Token type */
  tokenType: TokenType;

  /** Optional refresh token */
  refreshToken?: string;

  /** Token expiration timestamp */
  expiresAt?: string;

  /** Token issuer */
  issuer?: string;

  /** Token audience */
  audience?: string;

  /** Additional scopes/permissions */
  scopes?: string[];
}

/**
 * Bearer Token Credentials Interface
 * Bearer token authentication credentials
 */
export interface BearerTokenCredentials extends AuthCredentials {
  type: 'BEARER_TOKEN';
  tokenType: 'BEARER';
}

/**
 * API Key Credentials Interface
 * API key authentication credentials
 */
export interface APIKeyCredentials extends AuthCredentials {
  type: 'API_KEY';
  tokenType: 'API_KEY';

  /** API key identifier */
  keyId?: string;

  /** API key permissions */
  permissions?: string[];
}

/**
 * JWT Credentials Interface
 * JWT authentication credentials
 */
export interface JWTCredentials extends AuthCredentials {
  type: 'JWT';
  tokenType: 'JWT';

  /** JWT payload claims */
  claims?: JWTPayload;

  /** Public key for verification */
  publicKey?: string;
}

/**
 * JWT Payload Interface
 * Standard JWT claims
 */
export interface JWTPayload {
  /** Subject identifier */
  sub?: string;

  /** Issuer */
  iss?: string;

  /** Audience */
  aud?: string | string[];

  /** Expiration time */
  exp?: number;

  /** Not before */
  nbf?: number;

  /** Issued at */
  iat?: number;

  /** JWT ID */
  jti?: string;

  /** Custom claims */
  [key: string]: any;
}

/**
 * Session Cookie Credentials Interface
 * Session-based authentication credentials
 */
export interface SessionCredentials extends AuthCredentials {
  type: 'SESSION_COOKIE';
  tokenType: 'SESSION';

  /** Session identifier */
  sessionId: string;

  /** Cookie domain */
  domain?: string;

  /** Cookie path */
  path?: string;

  /** Secure flag */
  secure?: boolean;

  /** HTTP only flag */
  httpOnly?: boolean;

  /** Same site policy */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * OAuth2 Credentials Interface
 * OAuth2 authentication credentials
 */
export interface OAuth2Credentials extends AuthCredentials {
  type: 'OAUTH2';
  tokenType: 'OAUTH_ACCESS_TOKEN';

  /** OAuth2 grant type used */
  grantType?: 'authorization_code' | 'client_credentials' | 'refresh_token' | 'password';

  /** OAuth2 client identifier */
  clientId?: string;

  /** OAuth2 scopes */
  scopes?: string[];

  /** Refresh token */
  refreshToken?: string;

  /** Token endpoint URL */
  tokenEndpoint?: string;
}

/**
 * Authentication Headers Interface
 * HTTP headers for authentication
 */
export interface AuthHeaders {
  /** Authorization header */
  Authorization?: string;

  /** API key header */
  'X-API-Key'?: string;

  /** Custom API key header */
  'X-Auth-Token'?: string;

  /** JWT header */
  'X-JWT-Token'?: string;

  /** Session header */
  'X-Session-ID'?: string;

  /** Client ID header */
  'X-Client-ID'?: string;

  /** User agent header */
  'User-Agent'?: string;

  /** Content type header */
  'Content-Type'?: string;

  /** Accept header */
  'Accept'?: string;

  /** Origin header */
  'Origin'?: string;

  /** Referer header */
  'Referer'?: string;

  /** Request ID header */
  'X-Request-ID'?: string;

  /** Timestamp header */
  'X-Timestamp'?: string;

  /** Custom headers */
  [key: string]: string | undefined;
}

/**
 * Authentication Configuration Interface
 * Configuration for authentication handling
 */
export interface AuthConfig {
  /** Authentication type */
  type: AuthenticationType;

  /** Base URL for API */
  baseURL?: string;

  /** Token endpoint for OAuth2 */
  tokenEndpoint?: string;

  /** Refresh token endpoint */
  refreshEndpoint?: string;

  /** Revoke token endpoint */
  revokeEndpoint?: string;

  /** Client identifier */
  clientId?: string;

  /** Client secret */
  clientSecret?: string;

  /** Redirect URI for OAuth2 */
  redirectUri?: string;

  /** Scopes to request */
  scopes?: string[];

  /** Token header name */
  tokenHeader?: string;

  /** Token prefix */
  tokenPrefix?: string;

  /** Additional headers */
  additionalHeaders?: Record<string, string>;

  /** Cookie settings */
  cookieSettings?: CookieSettings;

  /** Auto refresh settings */
  autoRefresh?: boolean;

  /** Refresh threshold in seconds */
  refreshThreshold?: number;

  /** Storage settings */
  storage?: StorageConfig;
}

/**
 * Cookie Settings Interface
 * Configuration for cookie-based authentication
 */
export interface CookieSettings {
  /** Cookie name */
  name: string;

  /** Cookie domain */
  domain?: string;

  /** Cookie path */
  path?: string;

  /** Secure flag */
  secure?: boolean;

  /** HTTP only flag */
  httpOnly?: boolean;

  /** Same site policy */
  sameSite?: 'Strict' | 'Lax' | 'None';

  /** Cookie expiration in seconds */
  maxAge?: number;
}

/**
 * Storage Configuration Interface
 * Configuration for storing authentication data
 */
export interface StorageConfig {
  /** Storage type */
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'custom';

  /** Storage key prefix */
  keyPrefix?: string;

  /** Custom storage implementation */
  customStorage?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
  };
}

/**
 * Authentication Request Interface
 * Authentication request payload
 */
export interface AuthRequest {
  /** Authentication type */
  type: AuthenticationType;

  /** Authentication token */
  token: string;

  /** Token type */
  tokenType: TokenType;

  /** Optional refresh token */
  refreshToken?: string;

  /** Client information */
  client?: {
    id?: string;
    name?: string;
    version?: string;
  };

  /** Request metadata */
  metadata?: {
    timestamp?: string;
    requestId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * Authentication Response Interface
 * Authentication response from API
 */
export interface AuthResponse {
  /** Success status */
  success: boolean;

  /** Access token */
  accessToken?: string;

  /** Token type */
  tokenType?: TokenType;

  /** Token expiration in seconds */
  expiresIn?: number;

  /** Refresh token */
  refreshToken?: string;

  /** Scope granted */
  scope?: string;

  /** User information */
  user?: UserInfo;

  /** Response timestamp */
  timestamp: string;

  /** Response headers */
  headers?: Record<string, string>;

  /** Error information */
  error?: AuthError;
}

/**
 * User Information Interface
 * User details returned by authentication
 */
export interface UserInfo {
  /** Unique user identifier */
  id: string;

  /** Username */
  username: string;

  /** Display name */
  displayName?: string;

  /** Email address */
  email?: string;

  /** Avatar URL */
  avatarUrl?: string;

  /** Verification status */
  isVerified?: boolean;

  /** Account status */
  status?: 'active' | 'inactive' | 'suspended' | 'pending';

  /** Roles/permissions */
  roles?: string[];

  /** Account creation date */
  createdAt?: string;

  /** Last login date */
  lastLoginAt?: string;

  /** User preferences */
  preferences?: UserPreferences;

  /** Additional user data */
  [key: string]: any;
}

/**
 * User Preferences Interface
 * User preferences and settings
 */
export interface UserPreferences {
  /** Theme preference */
  theme?: 'light' | 'dark' | 'auto';

  /** Language preference */
  language?: string;

  /** Timezone */
  timezone?: string;

  /** Notification settings */
  notifications?: {
    email?: boolean;
    push?: boolean;
    webhooks?: boolean;
  };

  /** Privacy settings */
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    showActivity?: boolean;
    allowDirectMessages?: boolean;
  };
}

/**
 * Authentication Error Interface
 * Authentication error details
 */
export interface AuthError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** Error type */
  type?: 'AUTHENTICATION_FAILED' | 'TOKEN_EXPIRED' | 'INVALID_SCOPE' | 'RATE_LIMITED' | 'INVALID_REQUEST';

  /** Error details */
  details?: {
    field?: string;
    value?: any;
    constraint?: string;
    [key: string]: any;
  };

  /** Retry information */
  retry?: {
    after?: number;
    maxAttempts?: number;
  };

  /** Error timestamp */
  timestamp: string;
}

/**
 * Token Validation Result Interface
 * Result of token validation
 */
export interface TokenValidationResult {
  /** Valid status */
  valid: boolean;

  /** Token payload (for JWT) */
  payload?: JWTPayload;

  /** Token expiration status */
  expired?: boolean;

  /** Token expiration time */
  expiresAt?: string;

  /** Token issuer */
  issuer?: string;

  /** Token audience */
  audience?: string;

  /** Validation error */
  error?: AuthError;

  /** Validation timestamp */
  validatedAt: string;
}

/**
 * Session Information Interface
 * Active session information
 */
export interface SessionInfo {
  /** Session identifier */
  sessionId: string;

  /** User information */
  user: UserInfo;

  /** Authentication credentials */
  credentials: AuthCredentials;

  /** Session creation timestamp */
  createdAt: string;

  /** Session last activity timestamp */
  lastActivityAt: string;

  /** Session expiration timestamp */
  expiresAt: string;

  /** Session status */
  status: 'active' | 'expired' | 'revoked';

  /** IP address */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;

  /** Session permissions */
  permissions?: string[];

  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * Webhook Authentication Interface
 * Authentication for webhook requests
 */
export interface WebhookAuth {
  /** Webhook secret */
  secret: string;

  /** Signature header name */
  signatureHeader: string;

  /** Signature algorithm */
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';

  /** Tolerance for timestamp differences (seconds) */
  timestampTolerance?: number;
}

/**
 * Webhook Request Validation Interface
 * Result of webhook request validation
 */
export interface WebhookValidationResult {
  /** Valid status */
  valid: boolean;

  /** Webhook ID */
  webhookId?: string;

  /** Event type */
  eventType?: string;

  /** Payload */
  payload?: any;

  /** Validation error */
  error?: string;

  /** Validation timestamp */
  validatedAt: string;
}

/**
 * API Key Information Interface
 * API key details
 */
export interface APIKeyInfo {
  /** API key identifier */
  keyId: string;

  /** API key name */
  name: string;

  /** API key description */
  description?: string;

  /** Key permissions */
  permissions: string[];

  /** Key scopes */
  scopes: string[];

  /** Creation timestamp */
  createdAt: string;

  /** Last used timestamp */
  lastUsedAt?: string;

  /** Expiration timestamp */
  expiresAt?: string;

  /** Usage count */
  usageCount?: number;

  /** Rate limit settings */
  rateLimit?: {
    requestsPerHour?: number;
    requestsPerDay?: number;
  };

  /** Key status */
  status: 'active' | 'inactive' | 'expired' | 'revoked';

  /** Creator information */
  createdBy?: string;

  /** IP restrictions */
  ipRestrictions?: string[];

  /** Domain restrictions */
  domainRestrictions?: string[];
}

/**
 * Type guards for runtime validation
 */
export const isAuthCredentials = (obj: any): obj is AuthCredentials => {
  return obj &&
    typeof obj.type === 'string' &&
    typeof obj.token === 'string' &&
    typeof obj.tokenType === 'string';
};

export const isBearerTokenCredentials = (obj: any): obj is BearerTokenCredentials => {
  return isAuthCredentials(obj) &&
    obj.type === 'BEARER_TOKEN' &&
    obj.tokenType === 'BEARER';
};

export const isAPIKeyCredentials = (obj: any): obj is APIKeyCredentials => {
  return isAuthCredentials(obj) &&
    obj.type === 'API_KEY' &&
    obj.tokenType === 'API_KEY';
};

export const isJWTCredentials = (obj: any): obj is JWTCredentials => {
  return isAuthCredentials(obj) &&
    obj.type === 'JWT' &&
    obj.tokenType === 'JWT';
};

export const isSessionCredentials = (obj: any): obj is SessionCredentials => {
  return isAuthCredentials(obj) &&
    obj.type === 'SESSION_COOKIE' &&
    obj.tokenType === 'SESSION' &&
    typeof (obj as SessionCredentials).sessionId === 'string';
};

export const isAuthHeaders = (obj: any): obj is AuthHeaders => {
  return obj &&
    typeof obj === 'object' &&
    (obj.Authorization === undefined || typeof obj.Authorization === 'string') &&
    (obj['X-API-Key'] === undefined || typeof obj['X-API-Key'] === 'string');
};

export const isAuthError = (obj: any): obj is AuthError => {
  return obj &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.timestamp === 'string';
};

export const isUserInfo = (obj: any): obj is UserInfo => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.username === 'string';
};

/**
 * Authentication utility functions
 */
export const createBearerTokenCredentials = (token: string, options?: {
  expiresAt?: string;
  scopes?: string[];
}): BearerTokenCredentials => ({
  type: 'BEARER_TOKEN',
  tokenType: 'BEARER',
  token,
  expiresAt: options?.expiresAt,
  scopes: options?.scopes
});

export const createAPIKeyCredentials = (
  token: string,
  keyId?: string,
  options?: {
    expiresAt?: string;
    permissions?: string[];
  }
): APIKeyCredentials => ({
  type: 'API_KEY',
  tokenType: 'API_KEY',
  token,
  keyId,
  expiresAt: options?.expiresAt,
  permissions: options?.permissions
});

export const createAuthHeaders = (credentials: AuthCredentials, additionalHeaders?: Record<string, string>): AuthHeaders => {
  const headers: AuthHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'PumpFunClient/1.0',
    ...additionalHeaders
  };

  switch (credentials.type) {
    case 'BEARER_TOKEN':
      headers.Authorization = `Bearer ${credentials.token}`;
      break;
    case 'API_KEY':
      headers['X-API-Key'] = credentials.token;
      break;
    case 'JWT':
      headers.Authorization = `Bearer ${credentials.token}`;
      break;
    case 'SESSION_COOKIE':
      headers['X-Session-ID'] = credentials.token;
      break;
    default:
      // For other types, use generic auth header
      headers['X-Auth-Token'] = credentials.token;
  }

  return headers;
};

export const isTokenExpired = (credentials: AuthCredentials): boolean => {
  if (!credentials.expiresAt) {
    return false;
  }
  return new Date(credentials.expiresAt) <= new Date();
};

export const getTokenExpirationTime = (credentials: AuthCredentials): number | null => {
  if (!credentials.expiresAt) {
    return null;
  }
  return new Date(credentials.expiresAt).getTime();
};

export const shouldRefreshToken = (credentials: AuthCredentials, thresholdSeconds: number = 300): boolean => {
  const expirationTime = getTokenExpirationTime(credentials);
  if (!expirationTime) {
    return false;
  }
  const thresholdTime = expirationTime - (thresholdSeconds * 1000);
  return Date.now() >= thresholdTime;
};