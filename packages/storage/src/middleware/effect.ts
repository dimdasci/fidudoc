// Express Handler Bridge for Effect TS

import { Effect, type ManagedRuntime } from "effect";
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

    try {
      // Run Effect program with cancellation support
      const program = Effect.scoped(handler(req));
      const result = await runtime.runPromise(program, {
        signal: controller.signal,
      });

      // Success: send JSON response
      res.json(result);
    } catch (error) {
      // Handle errors through Express error middleware
      next(error);
    }
  };
