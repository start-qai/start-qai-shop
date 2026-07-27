import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CartSchema,
  AddToCartSchema,
  UpdateCartItemSchema,
  CheckoutResponseSchema,
  ApiErrorSchema,
} from "@qai-shop/shared";

extendZodWithOpenApi(z);

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  const bearer = registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    description:
      "Simulated token. Log in via POST /api/auth/login (demo/demo123) and use the returned token. Any other token => 401.",
  });
  const security = [{ [bearer.name]: [] }];

  const Login = registry.register("LoginRequest", LoginRequestSchema);
  const LoginResp = registry.register("LoginResponse", LoginResponseSchema);
  const Product = registry.register("Product", ProductSchema);
  const CreateProduct = registry.register("CreateProduct", CreateProductSchema);
  const UpdateProduct = registry.register("UpdateProduct", UpdateProductSchema);
  const Cart = registry.register("Cart", CartSchema);
  const AddToCart = registry.register("AddToCart", AddToCartSchema);
  const UpdateCartItem = registry.register("UpdateCartItem", UpdateCartItemSchema);
  const Checkout = registry.register("CheckoutResponse", CheckoutResponseSchema);
  const ApiErr = registry.register("ApiError", ApiErrorSchema);

  const json = (schema: unknown) => ({ "application/json": { schema: schema as never } });
  const errorResponse = (description: string) => ({
    description,
    content: json(ApiErr),
  });
  const unauthorized = errorResponse("Missing or invalid authorization token");

  /* ------------------------------- Health ------------------------------- */
  registry.registerPath({
    method: "get",
    path: "/api/health",
    tags: ["Health"],
    summary: "Health check",
    responses: {
      200: {
        description: "Service is running",
        content: json(z.object({ status: z.string(), timestamp: z.string() })),
      },
    },
  });

  /* -------------------------------- Auth -------------------------------- */
  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Login (simulated) – returns a hardcoded token",
    request: { body: { content: json(Login) } },
    responses: {
      200: { description: "Logged in", content: json(LoginResp) },
      400: errorResponse("Validation error"),
      401: errorResponse("Invalid credentials"),
    },
  });

  /* ------------------------------ Products ------------------------------ */
  registry.registerPath({
    method: "get",
    path: "/api/products",
    tags: ["Products"],
    summary: "List of products",
    security,
    responses: {
      200: { description: "List of products", content: json(z.array(Product)) },
      401: unauthorized,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/products",
    tags: ["Products"],
    summary: "Create a product",
    security,
    request: { body: { content: json(CreateProduct) } },
    responses: {
      201: { description: "Created", content: json(Product) },
      400: errorResponse("Validation error"),
      401: unauthorized,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Single product",
    security,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Product", content: json(Product) },
      401: unauthorized,
      404: errorResponse("Product does not exist"),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Update a product",
    security,
    request: {
      params: z.object({ id: z.string() }),
      body: { content: json(UpdateProduct) },
    },
    responses: {
      200: { description: "Updated", content: json(Product) },
      400: errorResponse("Validation error"),
      401: unauthorized,
      404: errorResponse("Product does not exist"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Delete a product",
    security,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      204: { description: "Deleted" },
      401: unauthorized,
      404: errorResponse("Product does not exist"),
    },
  });

  /* -------------------------------- Cart -------------------------------- */
  registry.registerPath({
    method: "get",
    path: "/api/cart",
    tags: ["Cart"],
    summary: "Get the cart",
    security,
    responses: {
      200: { description: "Cart", content: json(Cart) },
      401: unauthorized,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/cart",
    tags: ["Cart"],
    summary: "Add a product to the cart",
    security,
    request: { body: { content: json(AddToCart) } },
    responses: {
      201: { description: "Updated cart", content: json(Cart) },
      400: errorResponse("Validation error"),
      401: unauthorized,
      404: errorResponse("Product does not exist"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/cart/{productId}",
    tags: ["Cart"],
    summary: "Change item quantity (min. 1; removal via DELETE)",
    security,
    request: {
      params: z.object({ productId: z.string() }),
      body: { content: json(UpdateCartItem) },
    },
    responses: {
      200: { description: "Updated cart", content: json(Cart) },
      400: errorResponse("Validation error"),
      401: unauthorized,
      404: errorResponse("Item not in the cart"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/cart/{productId}",
    tags: ["Cart"],
    summary: "Remove an item from the cart",
    security,
    request: { params: z.object({ productId: z.string() }) },
    responses: {
      200: { description: "Updated cart", content: json(Cart) },
      401: unauthorized,
      404: errorResponse("Item not in the cart"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/cart",
    tags: ["Cart"],
    summary: "Clear the entire cart",
    security,
    responses: {
      200: { description: "Empty cart", content: json(Cart) },
      401: unauthorized,
    },
  });

  /* ------------------------------ Checkout ------------------------------ */
  registry.registerPath({
    method: "post",
    path: "/api/checkout",
    tags: ["Checkout"],
    summary: "Finalize the purchase (payment simulation skipped)",
    security,
    responses: {
      201: { description: "Order paid", content: json(Checkout) },
      400: errorResponse("The cart is empty"),
      401: unauthorized,
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Start QAI Shop API",
      version: "1.0.0",
      description:
        "REST API of the Start QAI Shop demo store (for training purposes). Authorization is simulated using a hardcoded token.\n\n" +
        "📄 [OpenAPI specification (JSON)](/docs/openapi.json)",
    },
    servers: [{ url: "http://localhost:4000", description: "Local development server" }],
  });
}
