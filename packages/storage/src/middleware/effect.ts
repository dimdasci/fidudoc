// Express Handler Bridge for Effect TS

import { Cause, Effect, Exit, type ManagedRuntime } from "effect";
import type { NextFunction, Request, Response } from "express";
import type { Principal } from "../Domain/Principal.ts";
import { CurrentPrincipal } from "../Domain/Principal.ts";
import type { User } from "../Domain/User.ts";
import { CurrentUser } from "../Domain/User.ts";
import type { AppRuntime } from "../Runtime.ts";

// Extract the context type that the runtime provides
export type AppContext = ManagedRuntime.ManagedRuntime.Context<AppRuntime>;

// Extend Express Request with optional auth context
export interface AuthenticatedRequest extends Request {
  user?: User;
  principal?: Principal;
}

// Type for Effect-based route handler
// R must be a subset of what the runtime provides
export type EffectHandler<R extends AppContext, E, A> = (
  req: Request,
) => Effect.Effect<A, E, R>;

// Bridge: Express handler → Effect → Express response
export const effectHandler = <R extends AppContext, E, A>(
  runtime: AppRuntime,
  handler: EffectHandler<R, E, A>,
) =>
async (req: Request, res: Response, next: NextFunction) => {
  // AbortController for request cancellation
  const controller = new AbortController();

  // Cancel on client disconnect
  req.on("close", () => {
    controller.abort();
  });

  // Build the Effect program
  let program = Effect.scoped(handler(req));

  // Provide per-request services if authenticated
  // Auth middleware sets req.user and req.principal
  const authReq = req as AuthenticatedRequest;
  if (authReq.user) {
    program = program.pipe(Effect.provideService(CurrentUser, authReq.user));
  }
  if (authReq.principal) {
    program = program.pipe(
      Effect.provideService(CurrentPrincipal, authReq.principal),
    );
  }

  // Run Effect program with cancellation support (type-safe, doesn't throw)
  const exit = await runtime.runPromiseExit(program, {
    signal: controller.signal,
  });

  // Pattern match on Exit to handle success/failure
  Exit.match(exit, {
    // Success case: send JSON response
    onSuccess: (value) => {
      res.json(value);
    },
    // Failure case: extract error and pass to Express error middleware
    onFailure: (cause) => {
      // Check if request was interrupted (cancelled)
      if (Cause.isInterrupted(cause)) {
        // Don't send response for cancelled requests
        return;
      }

      // Try to extract the domain error (Effect.fail)
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") {
        // Pass unwrapped domain error to error handler
        return next(failure.value);
      }

      // Try to extract defect (unexpected error like throw)
      const defect = Cause.dieOption(cause);
      if (defect._tag === "Some") {
        // Pass unwrapped defect to error handler
        return next(defect.value);
      }

      // Fallback for other cause types
      next(new Error("Unknown Effect error"));
    },
  });
};
