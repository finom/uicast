import type * as acorn from "acorn";
import { extractMemberReads, freeIdentifiers } from "./analyze";
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
	#cache = new Map<string, Analysis<TCompiled>>();
	#checking: { source: string; ast: acorn.Expression } | null = null;
	readonly #options: AnalyzerOptions;

	constructor(options: AnalyzerOptions) {
		this.#options = options;
	}

	analyze(source: string): Analysis<TCompiled> {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const { isTool, check, maxSourceLength, maxCacheSize } = this.#options;
		const ast = parseExpression(source, maxSourceLength);
		const outer = this.#checking;
		this.#checking = { source, ast };
		try {
			check(source);
		} finally {
			this.#checking = outer;
		}
		const freeIds = freeIdentifiers(ast);
		const entry: Analysis<TCompiled> = {
			source,
			ast,
			freeIds: Object.freeze(freeIds),
			toolCalls: Object.freeze(freeIds.filter(isTool)),
		};

		if (this.#cache.size >= maxCacheSize) {
			const oldest = this.#cache.keys().next().value;
			if (oldest !== undefined) this.#cache.delete(oldest);
		}
		this.#cache.set(source, entry);
		return entry;
	}

	// The tree `check` is looking at, so the rules need no second parse.
	parse(source: string): acorn.Expression {
		const checking = this.#checking;
		return checking?.source === source ? checking.ast : parseExpression(source, this.#options.maxSourceLength);
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
