import { Cause, Effect, Exit } from "effect";
import type { NextFunction, Request, Response } from "express";
import { validateToken } from "../Auth/Jwt.ts";
import type { AppRuntime } from "../Runtime.ts";
import type { AuthenticatedRequest } from "./effect.ts";

export const authMiddleware = (runtime: AppRuntime) =>
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

  // AbortController for request cancellation
  const controller = new AbortController();
  req.on("close", () => {
    controller.abort();
  });

  // Validate JWT and extract principal
  const program = Effect.gen(function*() {
    // Validate JWT and extract claims (userId, accountId)
    const principal = yield* validateToken(token);

    return { principal };
  });

  // Run Effect with cancellation support
  const exit = await runtime.runPromiseExit(program, {
    signal: controller.signal,
  });

  Exit.match(exit, {
    onSuccess: (value) => {
      // Store principal in request for per-request Effect context
      // This will be provided as CurrentPrincipal service to each Effect handler
      (req as AuthenticatedRequest).principal = value.principal;
      next();
    },
    onFailure: (cause) => {
      // Handle cancelled requests (user navigated away, connection closed)
      if (Cause.isInterrupted(cause)) {
        return;
      }

      // Extract domain errors (Effect.fail)
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") {
        const error = failure.value;

        // All auth failures → 401 (minimal error principle)
        // Don't leak whether token is invalid or expired
        if (
          error._tag === "InvalidToken"
          || error._tag === "TokenExpired"
        ) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      }

      // All other errors are unexpected (Supabase failures, etc.)
      // Log full details for debugging, but return generic 500
      console.error("[Auth Middleware] Unexpected error:", cause);
      res.status(500).json({ error: "Internal server error" });
    },
  });
};
