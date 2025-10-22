import * as Schema from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

export const Invoice = Schema.Struct({
  id: Schema.Number,
  customer: Schema.String,
  total: Schema.Number,
  currency: Schema.String,
});

export type Invoice = Schema.Schema.Type<typeof Invoice>;

export const fetchInvoices = Effect.tryPromise({
  try: async () => {
    const res = await fetch("/api/invoices");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Schema.decodeUnknownSync(Schema.Array(Invoice))(json);
  },
  catch: (e) => e as Error,
});
