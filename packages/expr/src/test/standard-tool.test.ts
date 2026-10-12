import type { StandardToolV0 } from "standard-tool";
import { expectTypeOf, it } from "vitest";
import type { StandardToolV0 as Copy } from "../host/standard-tool";

// Distinct type arguments, so a change on either side of a schema shows.
type In = { input: true };
type Out = { output: true };

it("copies standard-tool's StandardToolV0", () => {
  expectTypeOf<Copy<In, Out, string, { context: true }>>().toEqualTypeOf<
    StandardToolV0<In, Out, string, { context: true }>
  >();
});
