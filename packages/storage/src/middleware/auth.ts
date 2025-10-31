import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";
import { AccountId } from "../Domain/Account.ts";
import type { Principal } from "../Domain/Principal.ts";
import type { UserId } from "../Domain/User.ts";
import type { AuthenticatedRequest } from "./effect.ts";

const JwtPayload = Schema.Struct({
  sub: Schema.UUID, // Supabase user ID
  user_metadata: Schema.Struct({
    accountId: Schema.optional(Schema.UUID), // Optional for root users
  }),
});

export const authMiddleware = (supabaseClient: SupabaseClient) =>
async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Extract Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT with Supabase
    const { data, error } = await supabaseClient.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Parse and validate user metadata
    const decodeResult = Schema.decodeUnknownEither(JwtPayload)({
      sub: data.user.id,
      user_metadata: data.user.user_metadata || {},
    });

    if (decodeResult._tag === "Left") {
      console.error("[Auth Middleware] Invalid token payload:", decodeResult.left);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const payload = decodeResult.right;

    // Construct principal
    const principal: Principal = {
      userId: payload.sub as UserId,
      accountId: payload.user_metadata.accountId
        ? AccountId.make(payload.user_metadata.accountId)
        : undefined,
    };

    // Store principal in request for Effect handlers
    (req as AuthenticatedRequest).principal = principal;
    next();
  } catch (err) {
    // Unexpected errors (network failures, etc.)
    console.error("[Auth Middleware] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
