export const APP_NAME = "KSY Global Service";
export const APP_VERSION = "1.0.0";

export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
export const SESSION_MAX_AGE_PROD = 60 * 60 * 4; // 4 hours in production

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_AUDIT_PAGE_SIZE = 200;

export const MAX_DOCUMENT_ITEMS = 50;
export const MAX_DELIVERY_ITEMS = 50;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

export const RATE_LIMIT_LOGIN = { window: 600, max: 5 }; // 5 attempts per 10 minutes
export const RATE_LIMIT_API = { window: 60, max: 100 }; // 100 requests per minute

export const REQUEST_BODY_MAX_SIZE = 1024 * 1024; // 1MB

export const CACHE_CONTROL_STATIC = "public, max-age=31536000, immutable";
export const CACHE_CONTROL_API = "no-store";
