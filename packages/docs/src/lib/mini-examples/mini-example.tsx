"use client";
import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

// Provenance of each part, mirroring the pipeline the docs teach.
const PROV = {
  you: "you provide",
  gen: "generated from definition",
  llm: "the LLM generates",
  glue: "you mount it",
} as const;
type Prov = keyof typeof PROV;
type Lang = "js" | "jsx" | "json" | "md";

type CodeVariant = { label: string; code: string; lang: Lang };
export type CodePart = {
  name: string;
  file?: string;
  prov: Prov;
  code?: string;
  lang?: Lang;
  variants?: CodeVariant[];
  node?: ReactNode;
};
export type SetupPart = CodePart;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s: string) => esc(s).replace(/"/g, "&quot;");

// One-line glosses for the JSONLines keys, shown as hover tooltips on keys in
// the Entries block. Keyed by the bare key name (no quotes); a key is only
// tipped in key position (followed by `:`) inside a `json` block.
const KEY_TIPS: Record<string, string> = {
  key: "Unique id for this element.",
  component: "Which registered component this entry renders.",
  seed: "Initializes scope state once, when the element mounts.",
  props: "Props for the component: a literal value or an expr.",
  hidden: "Bare expression — the element hides when it is truthy.",
  callbacks: "Event handlers; their assignments run on user actions.",
  children: "Keys of child elements, in render order.",
  each: "List source — the array this element iterates over.",
  as: "Names the per-item scope created for a list.",
  keyBy: "Item field used as the stable key for list items.",
  set: "The scope path this assignment writes to.",
  expr: "A JavaScript expression, evaluated against scope.",
  literal: "A value used verbatim — never evaluated.",
  confirm: "Prompts the user to confirm before the assignment runs.",
  onClick: "An event handler; its assignments run on click.",
};

// Lightweight token highlighter (ported from the design). Emits `tk-*` spans the
// stylesheet colours per theme — kept local so docs code stays framework-free.
function highlight(code: string, lang: Lang): string {
  if (lang === "md") {
    return code
      .split("\n")
      .map((line) => {
        if (/^#{1,6}\s/.test(line))
          return `<span class="tk-kw">${esc(line)}</span>`;
        const m = line.match(/^(\s*-\s)(.*)$/);
        if (m)
          return `<span class="tk-punct">${esc(m[1])}</span><span class="tk-muted">${esc(m[2])}</span>`;
        return `<span class="tk-muted">${esc(line)}</span>`;
      })
      .join("\n");
  }
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:import|from|export|const|let|var|return|default|function|new|class|null|true|false|undefined|async|await|if|else|for|of|in|extends)\b)|([A-Za-z_$][\w$]*(?=\s*\())|([{}[\]().,;:])/g;
  const cls = [null, "tk-comment", "tk-str", "tk-num", "tk-kw", "tk-fn", "tk-punct"];
  let out = "";
  let last = 0;
  for (let m = re.exec(code); m; m = re.exec(code)) {
    if (m.index > last) out += esc(code.slice(last, m.index));
    let gi = 1;
    while (gi <= 6 && m[gi] == null) gi++;
    const end = m.index + m[0].length;
    if (gi === 2 && lang === "json") {
      const tip = KEY_TIPS[m[0].slice(1, -1)];
      if (tip && /^\s*:/.test(code.slice(end))) {
        out += `<span class="tk-str tk-key" data-tip="${attr(tip)}">${esc(m[0])}</span>`;
        last = end;
        continue;
      }
    }
    out += `<span class="${cls[gi]}">${esc(m[0])}</span>`;
    last = end;
  }
  out += esc(code.slice(last));
  return out;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mx-copy"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1100);
          })
          .catch(() => {});
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const Chip = ({ prov }: { prov: Prov }) => (
  <span className="mx-prov" data-prov={prov}>
    {PROV[prov]}
  </span>
);

function CodeCard({ name, file, prov, code, lang, variants, node }: CodePart) {
  const [sel, setSel] = useState(0);
  const active = variants?.[sel] ?? { code: code ?? "", lang: lang ?? "json" };
  return (
    <div className="mx-card" data-mdx={node ? "true" : undefined}>
      <div className="mx-card-head">
        <span className="mx-card-head-l">
          <span className="mx-name">{name}</span>
          {file ? <span className="mx-file">{file}</span> : null}
          <Chip prov={prov} />
        </span>
        {node ? null : <CopyButton text={active.code} />}
      </div>
      {variants ? (
        <div className="mx-switch-row">
          <span className="mx-switch">
            {variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                className="mx-switch-btn"
                data-active={i === sel}
                onClick={() => setSel(i)}
              >
                {v.label}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      {node ? (
        <div className="mx-mdx">{node}</div>
      ) : variants ? (
        <div className="mx-stack">
          {variants.map((v, i) => (
            <pre className="mx-pre" key={v.label} data-active={i === sel} aria-hidden={i !== sel}>
              <code dangerouslySetInnerHTML={{ __html: highlight(v.code, v.lang) }} />
            </pre>
          ))}
        </div>
      ) : (
        <pre className="mx-pre">
          <code dangerouslySetInnerHTML={{ __html: highlight(active.code, active.lang) }} />
        </pre>
      )}
    </div>
  );
}

export function MiniExample({
  kicker,
  title,
  concept,
  entry,
  result,
  setup,
  open = false,
}: {
  kicker: string;
  title: string;
  concept: string;
  entry: CodePart;
  result: ReactNode;
  setup: SetupPart[];
  open?: boolean;
}) {
  return (
    <article className="mini-example">
      <style>{CSS}</style>

      <div className="mx-head">
        <div className="mx-kicker">{kicker}</div>
        <h3 className="mx-title">{title}</h3>
        <p className="mx-concept">{concept}</p>
      </div>

      <div className="mx-hero">
        <CodeCard {...entry} />

        <div className="mx-card mx-result">
          <div className="mx-card-head">
            <span className="mx-card-head-l">
              <span className="mx-name">Result</span>
            </span>
          </div>
          <div className="mx-live-body">{result}</div>
        </div>
      </div>

      <details className="mx-built" open={open}>
        <summary className="mx-summary">
          <ChevronRight className="mx-chev" size={16} />
          <span className="mx-summary-strong">How it&apos;s built</span>
          <span className="mx-summary-dim">
            — definition, implementation, prompt &amp; wiring
          </span>
        </summary>
        <div className="mx-parts">
          {setup.map((part) => (
            <CodeCard key={part.name} {...part} />
          ))}
        </div>
      </details>
    </article>
  );
}

const CSS = `
.mini-example{
  --surface:#fff;--border:#e8e8ef;--text:#1b1c22;--muted:#6c6e7b;--faint:#9b9da9;
  --accent:#5650e6;--accent-soft:#ecebff;--teal:#0c8a72;--teal-soft:#e0f4ef;--warn:#bf5a12;--warn-soft:#f7e6d4;--slate:#5f6675;--slate-soft:#edeef3;
  --code-bg:#f7f7fb;--code-border:#ececf2;--app-bg:#f3f4f8;--app-grid:rgba(24,24,52,.045);
  --tok-comment:#8e909c;--tok-str:#0c8a72;--tok-num:#bf5a12;--tok-kw:#8a4fd6;--tok-fn:#2f6fd0;--tok-punct:#a6a8b4;
  display:block;background:var(--surface);border:1px solid var(--border);border-radius:16px;
  padding:26px 26px 22px;margin:26px 0;box-shadow:0 1px 2px rgba(20,20,40,.03);
  color:var(--text);font-family:'IBM Plex Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
}
.dark .mini-example{
  --surface:#161821;--border:#272a36;--text:#e7e8ef;--muted:#9b9eac;--faint:#6a6d7c;
  --accent:#a39dff;--accent-soft:#262356;--teal:#4fd2b4;--teal-soft:#103a31;--warn:#e0975a;--warn-soft:#3a2614;--slate:#a4abbd;--slate-soft:#252834;
  --code-bg:#101218;--code-border:#23252f;--app-bg:#0a0b0f;--app-grid:rgba(255,255,255,.045);
  --tok-comment:#6a6d7c;--tok-str:#7fd6b8;--tok-num:#e0975a;--tok-kw:#cb98f0;--tok-fn:#82aaff;--tok-punct:#5d6070;
}
.mini-example .mx-head{margin-bottom:20px}
.mini-example .mx-kicker{font:600 11.5px/1 'IBM Plex Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--faint);margin-bottom:9px}
.mini-example .mx-title{margin:0;font-size:19px;font-weight:600;letter-spacing:-.01em;color:var(--text)}
.mini-example .mx-concept{margin:7px 0 0;color:var(--muted);font-size:14px;line-height:1.55;max-width:70ch}
.mini-example .mx-hero{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch}
.mini-example .mx-card{border:1px solid var(--code-border);border-radius:12px;overflow:hidden;background:var(--code-bg);display:flex;flex-direction:column;min-width:0}
.mini-example .mx-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-bottom:1px solid var(--code-border)}
.mini-example .mx-card-head-l{display:inline-flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.mini-example .mx-name{font-size:12.5px;font-weight:600;color:var(--text)}
.mini-example .mx-file{font:400 11px 'IBM Plex Mono',monospace;color:var(--faint)}
.mini-example .mx-prov{font:500 10.5px 'IBM Plex Mono',monospace;padding:2px 8px;border-radius:999px;white-space:nowrap}
.mini-example .mx-prov[data-prov=you]{color:var(--slate);background:var(--slate-soft)}
.mini-example .mx-prov[data-prov=glue]{color:var(--warn);background:var(--warn-soft)}
.mini-example .mx-prov[data-prov=gen]{color:var(--teal);background:var(--teal-soft)}
.mini-example .mx-prov[data-prov=llm]{color:var(--accent);background:var(--accent-soft)}
.mini-example .mx-copy{flex:none;border:1px solid var(--code-border);background:transparent;color:var(--muted);font:500 10.5px 'IBM Plex Mono',monospace;padding:4px 9px;border-radius:7px;cursor:pointer}
.mini-example .mx-copy:hover{color:var(--text);border-color:var(--faint)}
.mini-example .mx-switch-row{display:flex;padding:8px 12px;border-bottom:1px solid var(--code-border)}
.mini-example .mx-switch{display:inline-flex;border:1px solid var(--code-border);border-radius:7px;overflow:hidden}
.mini-example .mx-switch-btn{border:none;background:transparent;color:var(--muted);font:500 10.5px 'IBM Plex Mono',monospace;padding:4px 9px;cursor:pointer}
.mini-example .mx-switch-btn+.mx-switch-btn{border-left:1px solid var(--code-border)}
.mini-example .mx-switch-btn[data-active=true]{background:var(--accent-soft);color:var(--accent)}
.mini-example .mx-switch-btn:not([data-active=true]):hover{color:var(--text)}
.mini-example .mx-pre{margin:0;padding:14px 16px;overflow:auto;font:500 12.5px/1.65 'IBM Plex Mono',monospace;color:var(--text)}
.mini-example .mx-pre code{font:inherit;display:block;white-space:pre}
.mini-example .mx-stack{display:grid}
.mini-example .mx-stack>.mx-pre{grid-area:1/1;min-width:0}
.mini-example .mx-stack>.mx-pre[data-active=false]{visibility:hidden}
.mini-example .mx-mdx pre{margin:0;padding:14px 16px;border:none;border-radius:0;box-shadow:none;background:var(--code-bg);color:var(--text)}
.mini-example .mx-mdx pre,.mini-example .mx-mdx code,.mini-example .mx-mdx span{font:500 12.5px/1.65 'IBM Plex Mono',monospace!important}
.mini-example .mx-mdx code>span{padding-inline:0!important}
.mini-example .mx-mdx span[style*="6A737D"]{--shiki-light:var(--tok-comment)!important;--shiki-dark:var(--tok-comment)!important}
.mini-example .mx-mdx span[style*="D73A49"]{--shiki-light:var(--tok-kw)!important;--shiki-dark:var(--tok-kw)!important}
.mini-example .mx-mdx span[style*="032F62"]{--shiki-light:var(--tok-str)!important;--shiki-dark:var(--tok-str)!important}
.mini-example .mx-mdx span[style*="6F42C1"]{--shiki-light:var(--tok-fn)!important;--shiki-dark:var(--tok-fn)!important}
.mini-example .mx-mdx span[style*="005CC5"]{--shiki-light:var(--tok-num)!important;--shiki-dark:var(--tok-num)!important}
.mini-example .mx-mdx span[style*="E36209"]{--shiki-light:var(--tok-num)!important;--shiki-dark:var(--tok-num)!important}
.mini-example .mx-mdx span[style*="24292E"]{--shiki-light:var(--text)!important;--shiki-dark:var(--text)!important}
.mini-example .mx-mdx span[style*="22863A"]{--shiki-light:var(--tok-fn)!important;--shiki-dark:var(--tok-fn)!important}
.mini-example .tk-comment{color:var(--tok-comment)}
.mini-example .tk-str{color:var(--tok-str)}
.mini-example .tk-num{color:var(--tok-num)}
.mini-example .tk-kw{color:var(--tok-kw)}
.mini-example .tk-fn{color:var(--tok-fn)}
.mini-example .tk-punct{color:var(--tok-punct)}
.mini-example .tk-muted{color:var(--muted)}
.mini-example .tk-key{position:relative;cursor:help;text-decoration:underline dotted;text-decoration-color:var(--faint);text-underline-offset:3px}
.mini-example .tk-key::after{content:attr(data-tip);position:absolute;left:0;bottom:calc(100% + 7px);z-index:30;width:max-content;max-width:230px;padding:7px 10px;background:var(--text);color:var(--surface);border-radius:8px;font:450 11.5px/1.45 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:normal;white-space:normal;text-align:left;box-shadow:0 8px 24px rgba(15,15,35,.22);opacity:0;transform:translateY(3px);pointer-events:none;transition:opacity .12s ease,transform .12s ease}
.mini-example .tk-key:hover::after{opacity:1;transform:translateY(0)}
.mini-example .mx-result{border-color:var(--border);background-color:var(--app-bg);background-image:radial-gradient(var(--app-grid) 1px,transparent 1px);background-size:13px 13px}
.mini-example .mx-result .mx-card-head{border-bottom-color:var(--border);background:var(--surface)}
.mini-example .mx-live-body{flex:1;display:flex;align-items:center;justify-content:center;padding:30px 20px;min-height:128px}
.mini-example .mx-live-body button{font:600 14px 'IBM Plex Sans',system-ui,sans-serif;background:var(--accent);color:#fff;border:none;padding:11px 18px;border-radius:10px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.mini-example .mx-live-body button:hover{filter:brightness(1.06)}
.mini-example .mx-built{margin-top:16px}
.mini-example .mx-built>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:10px 2px;color:var(--muted);font-size:13px;font-weight:500;user-select:none}
.mini-example .mx-built>summary::-webkit-details-marker{display:none}
.mini-example .mx-chev{flex:none;color:var(--faint);transition:transform .18s ease}
.mini-example .mx-built[open] .mx-chev{transform:rotate(90deg)}
.mini-example .mx-summary-strong{color:var(--text)}
.mini-example .mx-summary-dim{color:var(--faint);font-weight:400}
.mini-example .mx-parts{display:flex;flex-direction:column;gap:12px;padding:8px 0 4px}
@media(max-width:700px){
  .mini-example .mx-hero{grid-template-columns:1fr;gap:12px}
}
`;
