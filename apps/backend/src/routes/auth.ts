import { Router } from "express";
import { LoginRequestSchema, type LoginResponse } from "@qai-shop/shared";
import { config } from "../config.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";

export const authRouter = Router();

/** Simulated login: returns a hardcoded token for valid credentials; invalid => 401. */
authRouter.post(
  "/login",
  validateBody(LoginRequestSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as { username: string; password: string };

    if (username !== config.credentials.username || password !== config.credentials.password) {
      throw HttpError.unauthorized("Nieprawidłowa nazwa użytkownika lub hasło");
    }

    const body: LoginResponse = {
      token: config.authToken,
      user: { username },
    };
    res.json(body);
  }),
);
