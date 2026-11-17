import { Router } from "express";
import type { CheckoutResponse } from "@qai-shop/shared";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { getCart } from "../services/cart.service.js";

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);

/**
 * Finalizes the purchase: creates an order with a snapshot of the cart, clears the cart and
 * returns a summary. (Simulation – real payment is skipped, status is always PAID.)
 */
checkoutRouter.post(
  "/",
  asyncHandler(async (_req, res) => {
    const { cart, order } = await prisma.$transaction(async (tx) => {
      const cart = await getCart(tx);

      if (cart.items.length === 0) {
        throw HttpError.badRequest("Nie można sfinalizować zakupu – koszyk jest pusty");
      }

      // A freshly created order has updatedAt equal to createdAt.
      const now = new Date();
      const order = await tx.order.create({
        data: {
          createdAt: now,
          updatedAt: now,
          status: "PAID",
          totalPrice: cart.totalPrice,
          currency: cart.currency,
          itemsJson: JSON.stringify(cart.items),
        },
      });

      // Clear the cart in the same transaction that stores the order.
      await tx.cartItem.deleteMany({ where: { cartId: config.cartId } });

      return { cart, order };
    });

    const body: CheckoutResponse = {
      orderId: order.id,
      status: "PAID",
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
      currency: cart.currency,
      createdAt: order.createdAt.toISOString(),
      message: "Dziękujemy! Twoje zamówienie zostało opłacone i przyjęte do realizacji.",
    };
    res.status(201).json(body);
  }),
);
