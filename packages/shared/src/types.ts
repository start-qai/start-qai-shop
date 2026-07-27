import { z } from "zod";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CartItemSchema,
  CartSchema,
  AddToCartSchema,
  UpdateCartItemSchema,
  CheckoutResponseSchema,
  ApiErrorSchema,
} from "./schemas.js";

/** Types inferred from the Zod schemas – single source of truth for frontend and backend. */

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

export type ApiError = z.infer<typeof ApiErrorSchema>;
