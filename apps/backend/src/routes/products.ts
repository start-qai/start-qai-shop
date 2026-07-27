import { Router } from "express";
import { randomUUID } from "node:crypto";
import { CreateProductSchema, UpdateProductSchema, type Product } from "@qai-shop/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { toProductDto } from "../lib/mappers.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
    const body: Product[] = products.map(toProductDto);
    res.json(body);
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      throw HttpError.notFound(`Produkt o id '${req.params.id}' nie istnieje`);
    }
    res.json(toProductDto(product));
  }),
);

productsRouter.post(
  "/",
  validateBody(CreateProductSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as import("@qai-shop/shared").CreateProductInput;
    const product = await prisma.product.create({
      data: { id: randomUUID(), ...input },
    });
    res.status(201).json(toProductDto(product));
  }),
);

productsRouter.put(
  "/:id",
  validateBody(UpdateProductSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw HttpError.notFound(`Produkt o id '${req.params.id}' nie istnieje`);
    }
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body as import("@qai-shop/shared").UpdateProductInput,
    });
    res.json(toProductDto(product));
  }),
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw HttpError.notFound(`Produkt o id '${req.params.id}' nie istnieje`);
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
