export type JsonToken = { text: string; kind: "key" | "str" | "num" | "bool" | "null" | "punct" };

// `rest` is the text after the token: a string followed by `:` is a key.
function kindOf(text: string, rest: string): JsonToken["kind"] {
  if (text.startsWith('"')) return /^\s*:/.test(rest) ? "key" : "str";
  if (text === "null") return "null";
  return text === "true" || text === "false" ? "bool" : "num";
}

// The text between tokens is `punct`.
export function tokenizeJson(json: string): JsonToken[] {
  const out: JsonToken[] = [];
  const re = /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let last = 0;
  for (let m = re.exec(json); m; m = re.exec(json)) {
    if (m.index > last) out.push({ text: json.slice(last, m.index), kind: "punct" });
    out.push({ text: m[0], kind: kindOf(m[0], json.slice(re.lastIndex)) });
    last = re.lastIndex;
  }
  if (last < json.length) out.push({ text: json.slice(last), kind: "punct" });
  return out;
}

export type ExpressionToken = { text: string; kind: "scope" | "ident" | "fn" | "str" | "num" | "kw" | "punct" };

// Entry fields whose string value is an expression or a scope path.
export const EXPRESSION_KEYS = new Set(["expr", "set", "each", "hidden", "busy"]);

// The text between tokens is `punct`.
export function tokenizeExpression(source: string): ExpressionToken[] {
  const out: ExpressionToken[] = [];
  const re =
    /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null|undefined)\b|\b(scopes|evt|currentValue)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|(=>)/g;
  let last = 0;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    if (m.index > last) out.push({ text: source.slice(last, m.index), kind: "punct" });
    const kind = m[1] ? "str" : m[2] ? "num" : m[3] || m[7] ? "kw" : m[4] ? "scope" : m[5] ? "fn" : "ident";
    out.push({ text: m[0], kind });
    last = re.lastIndex;
  }
  if (last < source.length) out.push({ text: source.slice(last), kind: "punct" });
  return out;
}
