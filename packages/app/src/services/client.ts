import * as Effect from "effect/Effect";

export const run = <A>(fx: Effect.Effect<A, unknown, never>) => Effect.runPromise(fx);
