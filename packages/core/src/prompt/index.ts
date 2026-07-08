// @ui-fired/core/prompt — the LLM prompt-partial builders. Every builder takes
// a single options object so signatures can grow without breaking callers.

export {
	type CommonInstructionsPromptOptions,
	getCommonInstructionsPartialPrompt,
} from "./get-common-instructions-partial-prompt";
export {
	type ComponentsPromptOptions,
	getComponentsPartialPrompt,
} from "./get-components-partial-prompt";
export {
	type EditRequestPromptOptions,
	getEditRequestPrompt,
} from "./get-edit-request-prompt";
export {
	type ErrorRecoveryPromptOptions,
	getErrorRecoveryPrompt,
	type RenderFailure,
} from "./get-error-recovery-prompt";
export {
	type ExpressionsPromptOptions,
	getExpressionsPartialPrompt,
} from "./get-expressions-partial-prompt";
export {
	type FunctionsPromptOptions,
	getFunctionsPartialPrompt,
} from "./get-functions-partial-prompt";
export {
	getScopePartialPrompt,
	type ScopePromptOptions,
} from "./get-scope-partial-prompt";
