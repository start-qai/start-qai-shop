/**
 * Shared constants used by the backend and frontend.
 *
 * NOTE (training): authentication is SIMULATED. There is no real OAuth or JWT here.
 * Login returns a single hardcoded token; any other token => 401.
 */

/** Default demo token (can be overridden by the DEMO_AUTH_TOKEN env variable on the backend). */
export const DEMO_AUTH_TOKEN = "qai-shop-demo-token-2026";

export const DEMO_CREDENTIALS = {
  username: "demo",
  password: "demo123",
} as const;

export const AUTH_HEADER = "authorization";

export const BEARER_PREFIX = "Bearer ";

export const SUPPORTED_CURRENCY = "PLN";

export const MAX_CART_ITEM_QUANTITY = 99;
export const MAX_PRODUCT_PRICE = 100_000;
