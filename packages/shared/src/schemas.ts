import { z } from "zod";
import { MAX_CART_ITEM_QUANTITY, MAX_PRODUCT_PRICE, SUPPORTED_CURRENCY } from "./constants.js";

/**
 * Validation schemas (Zod) shared by the backend (validation + OpenAPI) and frontend (types).
 */

/* ----------------------------- Auth ----------------------------- */

export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Nazwa użytkownika jest wymagana"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    username: z.string(),
  }),
});

/* --------------------------- Products --------------------------- */

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nonnegative().max(MAX_PRODUCT_PRICE),
  currency: z.literal(SUPPORTED_CURRENCY),
  imageUrl: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProductSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"),
  price: z.number().nonnegative("Cena nie może być ujemna").max(MAX_PRODUCT_PRICE),
  currency: z.literal(SUPPORTED_CURRENCY).default(SUPPORTED_CURRENCY),
  imageUrl: z.string().min(1, "Adres zdjęcia jest wymagany"),
});

export const UpdateProductSchema = CreateProductSchema.partial();

/* ----------------------------- Cart ----------------------------- */

export const CartItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  price: z.number(),
  currency: z.literal(SUPPORTED_CURRENCY),
  imageUrl: z.string(),
  quantity: z.number().int().positive().max(MAX_CART_ITEM_QUANTITY),
  lineTotal: z.number(),
});

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  totalItems: z.number().int().nonnegative(),
  totalPrice: z.number().nonnegative(),
  currency: z.literal(SUPPORTED_CURRENCY),
});

export const AddToCartSchema = z.object({
  productId: z.string().min(1, "productId jest wymagany"),
  quantity: z.number().int().positive().max(MAX_CART_ITEM_QUANTITY).default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive("Ilość musi być większa od zera").max(MAX_CART_ITEM_QUANTITY),
});

/* --------------------------- Checkout --------------------------- */

export const CheckoutResponseSchema = z.object({
  orderId: z.string(),
  status: z.literal("PAID"),
  items: z.array(CartItemSchema),
  totalItems: z.number().int().nonnegative(),
  totalPrice: z.number().nonnegative(),
  currency: z.literal(SUPPORTED_CURRENCY),
  createdAt: z.string(),
  message: z.string(),
});

/* ----------------------------- Error ----------------------------- */

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
