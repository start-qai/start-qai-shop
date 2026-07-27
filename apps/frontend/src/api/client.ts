import type { ApiError, Cart, CheckoutResponse, LoginResponse, Product } from "@qai-shop/shared";
import { API_URL } from "./config";
import { tokenStore } from "./token";

/** HTTP error from the API, preserving the status code and body. */
export class ApiRequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, body: ApiError) {
    super(body.message ?? "Błąd zapytania");
    this.status = status;
    this.code = body.error ?? "ERROR";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Whether to attach the Authorization header with the token (default: yes). */
  auth?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) unauthorizedHandler?.();
    throw new ApiRequestError(res.status, data as ApiError);
  }
  return data as T;
}

/* ------------------------------- Auth ------------------------------- */
export function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

/* ----------------------------- Products ----------------------------- */
export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products");
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`);
}

/* ------------------------------- Cart ------------------------------- */
export function getCart(): Promise<Cart> {
  return apiFetch<Cart>("/api/cart");
}

export function addToCart(productId: string, quantity = 1): Promise<Cart> {
  return apiFetch<Cart>("/api/cart", {
    method: "POST",
    body: { productId, quantity },
  });
}

export function updateCartItem(productId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/${productId}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export function removeCartItem(productId: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/${productId}`, { method: "DELETE" });
}

export function clearCart(): Promise<Cart> {
  return apiFetch<Cart>("/api/cart", { method: "DELETE" });
}

/* ----------------------------- Checkout ----------------------------- */
export function checkout(): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/api/checkout", { method: "POST" });
}
