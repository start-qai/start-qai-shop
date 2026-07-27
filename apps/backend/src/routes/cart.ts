import { Router } from "express";
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
} from "@qai-shop/shared";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { getCart } from "../services/cart.service.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getCart());
  }),
);

/** Adds a product to the cart (increments the quantity if already present). */
cartRouter.post(
  "/",
  validateBody(AddToCartSchema),
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body as AddToCartInput;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw HttpError.notFound(`Produkt o id '${productId}' nie istnieje`);
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: config.cartId, productId } },
      create: { cartId: config.cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    res.status(201).json(await getCart());
  }),
);

/** Sets an exact quantity (min. 1; removal is done via DELETE). */
cartRouter.patch(
  "/:productId",
  validateBody(UpdateCartItemSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body as UpdateCartItemInput;

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: config.cartId, productId } },
    });
    if (!existing) {
      throw HttpError.notFound(`W koszyku nie ma produktu o id '${productId}'`);
    }

    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: config.cartId, productId } },
      data: { quantity },
    });

    res.json(await getCart());
  }),
);

cartRouter.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: config.cartId, productId } },
    });
    if (!existing) {
      throw HttpError.notFound(`W koszyku nie ma produktu o id '${productId}'`);
    }
    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId: config.cartId, productId } },
    });
    res.json(await getCart());
  }),
);

cartRouter.delete(
  "/",
  asyncHandler(async (_req, res) => {
    await prisma.cartItem.deleteMany({ where: { cartId: config.cartId } });
    res.json(await getCart());
  }),
);
