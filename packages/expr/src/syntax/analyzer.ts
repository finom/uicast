import type * as acorn from "acorn";
import { freeIdentifiers, memberReads } from "./ast";
import { parseExpression } from "./parse";

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
	isTool: (name: string) => boolean;
	// The language rules, or whatever replaces them. Throws to refuse the source.
	check: (source: string) => void;
	maxSourceLength: number;
	maxCacheSize: number;
};

// Keyed by source alone, which is only sound because the host functions are fixed for the analyzer's lifetime.
// The facts are collected whatever `check` does: the host needs them to run the expression at all.
export class Analyzer<TCompiled> {
	readonly #cache = new Map<string, Analysis<TCompiled>>();
	// The last tree parsed, so `check` parsing the same source again costs nothing.
	#parsed: { source: string; ast: acorn.Expression } | null = null;
	readonly #options: AnalyzerOptions;

	constructor(options: AnalyzerOptions) {
		this.#options = options;
	}

	analyze(source: string): Analysis<TCompiled> {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const { isTool, check, maxCacheSize } = this.#options;
		const ast = this.parse(source);
		check(source);
		const freeIds = Object.freeze(freeIdentifiers(ast));
		const entry: Analysis<TCompiled> = { source, ast, freeIds, toolCalls: Object.freeze(freeIds.filter(isTool)) };

		const oldest = this.#cache.keys().next().value;
		if (this.#cache.size >= maxCacheSize && oldest !== undefined) this.#cache.delete(oldest);
		this.#cache.set(source, entry);
		return entry;
	}

	parse(source: string): acorn.Expression {
		if (this.#parsed && this.#parsed.source === source) return this.#parsed.ast;
		const ast = parseExpression(source, this.#options.maxSourceLength);
		this.#parsed = { source, ast };
		return ast;
	}

	memberReads(source: string, root: string): readonly string[] {
		const entry = this.analyze(source);
		entry.reads ??= new Map();
		let paths = entry.reads.get(root);
		if (paths === undefined) {
			paths = Object.freeze(memberReads(entry.ast, root));
			entry.reads.set(root, paths);
		}
		return paths;
	}
}
