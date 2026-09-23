import { fail } from "./values";

// Math.f16round and Math.sumPrecise, written out: both are newer than the engines this package runs on.

const F16_OVERFLOW = 65_520; // halfway from the largest half-precision value to 2^16: a tie, rounded to even, which is infinity
const F16_MIN_NORMAL = 2 ** -14;
const F16_SUBNORMAL_STEP = 2 ** -24;
const F16_FRACTION_BITS = 10;

const roundHalfEven = (v: number): number => {
	const floor = Math.floor(v);
	const diff = v - floor;
	if (diff < 0.5) return floor;
	if (diff > 0.5) return floor + 1;
	return floor % 2 === 0 ? floor : floor + 1;
};

// log2 can land a hair off at a power of two, so the exponent is checked both ways.
const binade = (magnitude: number): number => {
	let e = Math.floor(Math.log2(magnitude));
	if (2 ** e > magnitude) e--;
	if (2 ** (e + 1) <= magnitude) e++;
	return e;
};

export const f16round = (x: number): number => {
	if (!Number.isFinite(x) || x === 0) return x;
	const magnitude = Math.abs(x);
	if (magnitude >= F16_OVERFLOW) return x > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	const step = magnitude < F16_MIN_NORMAL ? F16_SUBNORMAL_STEP : 2 ** (binade(magnitude) - F16_FRACTION_BITS);
	const rounded = roundHalfEven(magnitude / step) * step;
	return x > 0 ? rounded : -rounded;
};

// Every finite double is a whole multiple of 2^-1074, so scaled by 2^1074 a sum of them is an exact BigInt.
const MIN_EXPONENT = -1074;
const SIGNIFICAND_BITS = 53;
const HIGH_WORD = 32n;
const IMPLICIT_BIT = 1n << 52n;
const view = new DataView(new ArrayBuffer(8));

const toUnits = (x: number): bigint => {
	view.setFloat64(0, x);
	const high = view.getUint32(0);
	const exponent = (high >>> 20) & 0x7ff;
	const fraction = (BigInt(high & 0xfffff) << HIGH_WORD) | BigInt(view.getUint32(4));
	const significand = exponent === 0 ? fraction : fraction | IMPLICIT_BIT;
	const magnitude = significand << BigInt(Math.max(exponent, 1) - 1);
	return high >>> 31 === 1 ? -magnitude : magnitude;
};

// Round to 53 significant bits, ties to even; past the largest double the product is infinity, as it should be.
const toDouble = (units: bigint): number => {
	let magnitude = units < 0n ? -units : units;
	let exponent = MIN_EXPONENT;
	const bits = magnitude.toString(2).length;
	if (bits > SIGNIFICAND_BITS) {
		const drop = BigInt(bits - SIGNIFICAND_BITS);
		const kept = magnitude >> drop;
		const rest = magnitude - (kept << drop);
		const half = 1n << (drop - 1n);
		const roundUp = rest > half || (rest === half && (kept & 1n) === 1n);
		magnitude = roundUp ? kept + 1n : kept;
		exponent += bits - SIGNIFICAND_BITS;
	}
	const value = Number(magnitude) * 2 ** exponent;
	return units < 0n ? -value : value;
};

export const sumPrecise = (items: readonly unknown[]): number => {
	let total = 0n;
	let allNegativeZero = true;
	let nonFinite: number | null = null;
	for (const item of items) {
		if (typeof item !== "number") return fail(`Math.sumPrecise needs numbers, got ${typeof item}`);
		if (!Number.isFinite(item)) {
			// Two different non-finite values (NaN, or both infinities) make NaN.
			nonFinite = nonFinite === null || Object.is(nonFinite, item) ? item : Number.NaN;
		} else {
			if (!Object.is(item, -0)) allNegativeZero = false;
			if (item !== 0) total += toUnits(item);
		}
	}
	if (nonFinite !== null) return nonFinite;
	if (allNegativeZero) return -0;
	return toDouble(total);
};
