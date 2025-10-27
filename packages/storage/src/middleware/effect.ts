// Express Handler Bridge for Effect TS

import { Cause, Effect, Exit, type ManagedRuntime } from "effect";
import type { NextFunction, Request, Response } from "express";
import type { AppRuntime } from "../runtime.ts";

// Extract the context type that the runtime provides
export type AppContext = ManagedRuntime.ManagedRuntime.Context<AppRuntime>;

// Type for Effect-based route handler
// R must be a subset of what the runtime provides
export type EffectHandler<R extends AppContext, E, A> = (
  req: Request,
) => Effect.Effect<A, E, R>;

// Bridge: Express handler → Effect → Express response
export const effectHandler =
  <R extends AppContext, E, A>(
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

    // Run Effect program with cancellation support (type-safe, doesn't throw)
    const program = Effect.scoped(handler(req));
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
