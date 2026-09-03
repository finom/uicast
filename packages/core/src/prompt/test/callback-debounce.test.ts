import { describe, expect, it } from "vitest";
import { CALLBACK_DEBOUNCE_MS } from "../../constants";
import { getCommonInstructionsPartialPrompt } from "../get-common-instructions-partial-prompt";

describe("callback debounce", () => {
	it("the prompt states the same delay the binding uses", () => {
		expect(getCommonInstructionsPartialPrompt()).toContain(`${CALLBACK_DEBOUNCE_MS} ms`);
	});
});
