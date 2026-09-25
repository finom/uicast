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
