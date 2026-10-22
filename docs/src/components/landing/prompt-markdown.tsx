import { Fragment } from "react";

const C = {
  head: "#C6FF3D",
  name: "#A795FF",
  type: "#6EE7C8",
  str: "#F0C987",
  desc: "#8E87A8",
  punct: "#6F6A88",
  text: "#DAD8EA",
};

type Seg = [string, string];

// Types, string literals and comments inside a signature.
function code(text: string, color: string): Seg[] {
  const out: Seg[] = [];
  const re = /("[^"]*")|(\/\*.*?\*\/)|\b(string|number|boolean)\b|([A-Za-z_]\w*)(?=\??:|\()|([{}[\]()|;,:?=>…]+)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push([text.slice(last, m.index), color]);
    out.push([m[0], m[1] ? C.str : m[2] ? C.punct : m[3] ? C.type : m[4] ? C.name : C.punct]);
    last = re.lastIndex;
  }
  if (last < text.length) out.push([text.slice(last), color]);
  return out;
}

function line(text: string): Seg[] {
  if (/^#{1,6} /.test(text)) return [[text, C.head]];
  if (/^\s*[A-Z][\w ]*:$/.test(text)) return [[text, C.desc]];
  const item = text.match(/^(\s*- )(.*)$/);
  if (!item) return code(text, C.text);
  // The description follows " — ", or "]: " after a return type.
  const at = item[2].search(/ — |(?<=\]): /);
  const sig = at < 0 ? item[2] : item[2].slice(0, at);
  const name = sig.match(/^[A-Za-z_]\w*/)?.[0] ?? "";
  return [
    [item[1], C.punct],
    [name, C.name],
    ...code(sig.slice(name.length), C.text),
    ...(at < 0 ? [] : ([[item[2].slice(at), C.desc]] as Seg[])),
  ];
}

export function PromptMarkdown({ text }: { text: string }) {
  return text.split("\n").map((ln, i) => (
    <Fragment key={i}>
      {i > 0 && "\n"}
      {line(ln).map(([t, color], j) => (
        <span key={j} style={{ color }}>
          {t}
        </span>
      ))}
    </Fragment>
  ));
}
