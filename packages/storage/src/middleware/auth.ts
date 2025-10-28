import { Model } from "@effect/sql";
import { Cause, DateTime, Effect, Exit, Option } from "effect";
import type { NextFunction, Request, Response } from "express";
import { validateToken } from "../Auth/Jwt.ts";
import type { AppRuntime } from "../Runtime.ts";
import { UsersRepo } from "../Users/Repo.js";
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

  // Validate JWT and check user
  const program = Effect.gen(function*() {
    // Validate JWT
    const principal = yield* validateToken(token);

    // Load user from database
    const usersRepo = yield* UsersRepo;
    const userOption = yield* usersRepo.findById(principal.userId);

    // Treat missing or inactive users the same way - don't leak info
    if (userOption._tag === "None" || !userOption.value.isActive) {
      return yield* Effect.fail({ _tag: "Unauthorized" as const });
    }

    const user = userOption.value;

    // Update last login (fire and forget with runtime)
    runtime.runFork(
      usersRepo
        .update({
          ...user,
          lastLoginAt: Option.some(DateTime.unsafeNow()),
          updatedAt: Model.Override(DateTime.unsafeNow()),
        })
        .pipe(Effect.ignore),
    );

    return { principal, user };
  });

  // Run Effect with cancellation support
  const exit = await runtime.runPromiseExit(program, {
    signal: controller.signal,
  });

  Exit.match(exit, {
    onSuccess: (value) => {
      // Store user and principal in request for per-request Effect context
      // These will be provided as services to each Effect handler
      (req as AuthenticatedRequest).principal = value.principal;
      (req as AuthenticatedRequest).user = value.user;
      next();
    },
    onFailure: (cause) => {
      // Handle cancelled requests
      if (Cause.isInterrupted(cause)) {
        return;
      }

      // Extract domain error
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") {
        const error = failure.value;

        // All auth failures → 401 (minimal error principle)
        if (
          error._tag === "InvalidToken"
          || error._tag === "TokenExpired"
          || error._tag === "Unauthorized"
        ) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      }

      // Unexpected errors
      res.status(500).json({ error: "Internal server error" });
    },
  });
};
