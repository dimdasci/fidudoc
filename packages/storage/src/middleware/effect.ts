// Express Handler Bridge for Effect TS

import { Cause, Effect, Exit, type ManagedRuntime } from "effect";
import type { NextFunction, Request, Response } from "express";
import type { Principal } from "../Domain/Principal.ts";
import { CurrentPrincipal } from "../Domain/Principal.ts";
import type { AppRuntime } from "../Runtime.ts";

// Extract the context type that the runtime provides
export type AppContext = ManagedRuntime.ManagedRuntime.Context<AppRuntime>;

// Extend Express Request with optional auth context
export interface AuthenticatedRequest extends Request {
  principal?: Principal;
}

// Type for Effect-based route handler
// R can extend AppContext with per-request services (CurrentUser, CurrentPrincipal)
export type EffectHandler<R, E, A> = (
  req: Request,
) => Effect.Effect<A, E, R>;

// Bridge: Express handler → Effect → Express response
export const effectHandler = <E, A>(
  runtime: AppRuntime,
  handler: EffectHandler<AppContext | CurrentPrincipal, E, A>,
) =>
async (req: Request, res: Response, next: NextFunction) => {
  // Build the Effect program
  let program = handler(req);

  // Provide per-request services if authenticated
  // Auth middleware sets req.principal
  const authReq = req as AuthenticatedRequest;
  if (authReq.principal) {
    program = program.pipe(
      Effect.provideService(CurrentPrincipal, authReq.principal),
    );
  }

  // Run Effect program (type-safe, doesn't throw)
  // Type cast needed because per-request services are provided dynamically
  const exit = await runtime.runPromiseExit(
    program as Effect.Effect<A, E, AppContext>,
  );

  // Pattern match on Exit to handle success/failure
  Exit.match(exit, {
    // Success case: send JSON response
    onSuccess: (value) => {
      res.json(value);
    },
    // Failure case: extract error and pass to Express error middleware
    onFailure: (cause) => {
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

      // Check if request was interrupted (should not happen without abort signal)
      if (Cause.isInterrupted(cause)) {
        console.error(
          "[effectHandler] UNEXPECTED: Effect was interrupted without abort signal",
          {
            method: req.method,
            url: req.url,
            cause: Cause.pretty(cause),
          },
        );
        // Still send error response instead of hanging
        return next(new Error("Request processing was interrupted"));
      }

      // Fallback for other cause types (should be rare)
      console.error(
        "[effectHandler] Unknown Effect error type",
        {
          method: req.method,
          url: req.url,
          cause: Cause.pretty(cause),
        },
      );
      next(new Error("Unknown Effect error"));
    },
  });
};
