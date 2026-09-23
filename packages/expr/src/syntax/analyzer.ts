import type * as acorn from "acorn";
import type { HostFunction } from "../runtime/values";
import { extractMemberReads } from "./analyze";
import { parseExpression } from "./parse";
import { validateFreeIdentifiers, validateNode } from "./validate";

export type ExpressionFacts = {
	freeIds: readonly string[];
	toolCalls: readonly string[];
};

// `compiled` is whatever the back end makes of it, once.
export type Analysis<TCompiled> = ExpressionFacts & {
	source: string;
	ast: acorn.Expression;
	reads?: Map<string, readonly string[]>;
	compiled?: TCompiled;
};

type AnalyzerOptions = {
	tools: Record<string, HostFunction>;
	maxSourceLength: number;
	maxCacheSize: number;
};

// Keyed by source alone, which is only sound because the host functions are fixed for the analyzer's lifetime.
export class Analyzer<TCompiled> {
	#cache = new Map<string, Analysis<TCompiled>>();
	readonly #options: AnalyzerOptions;

	constructor(options: AnalyzerOptions) {
		this.#options = options;
	}

	analyze(source: string): Analysis<TCompiled> {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const { tools, maxSourceLength, maxCacheSize } = this.#options;
		const ast = parseExpression(source, maxSourceLength);
		validateNode(ast);
		const freeIds = validateFreeIdentifiers(ast, (name) => tools[name] !== undefined);
		const entry: Analysis<TCompiled> = {
			source,
			ast,
			freeIds: Object.freeze(freeIds),
			toolCalls: Object.freeze(freeIds.filter((id) => tools[id] !== undefined)),
		};

		if (this.#cache.size >= maxCacheSize) {
			const oldest = this.#cache.keys().next().value;
			if (oldest !== undefined) this.#cache.delete(oldest);
		}
		this.#cache.set(source, entry);
		return entry;
	}

	memberReads(source: string, root: string): readonly string[] {
		const entry = this.analyze(source);
		entry.reads ??= new Map();
		let paths = entry.reads.get(root);
		if (paths === undefined) {
			paths = Object.freeze(extractMemberReads(entry.ast, root));
			entry.reads.set(root, paths);
		}
		return paths;
	}
}
