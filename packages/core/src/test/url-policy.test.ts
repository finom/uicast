import { describe, expect, it } from "vitest";
import { checkUrl, findUrlViolations, schemaHasUrlFormat, type UrlPolicy } from "../url-policy";

const ORIGIN = "https://app.example.com";
const at = (extra?: Partial<Exclude<UrlPolicy, (u: string) => boolean>>): UrlPolicy => ({
  origin: ORIGIN,
  ...extra,
});

const ok = (value: string, policy?: UrlPolicy) => checkUrl(value, policy).ok;

describe("checkUrl — schemes that must never pass", () => {
  it("rejects javascript: in every spelling a browser still honours", () => {
    for (const value of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "JAVASCRIPT:alert(1)",
      "  javascript:alert(1)",
      "\tjavascript:alert(1)",
      "\njavascript:alert(1)",
      "\u0000javascript:alert(1)",
      "\u0001\u0002javascript:alert(1)",
      "java\nscript:alert(1)",
      "java\tscript:alert(1)",
      "java\rscript:alert(1)",
      "jav\na\tscript:alert(1)",
    ]) {
      expect(ok(value, at()), JSON.stringify(value)).toBe(false);
    }
  });

  it("trims a long run of spaces in linear time", () => {
    const spaces = " ".repeat(100_000);
    expect(ok(`${spaces}javascript:alert(1)${spaces}x`, at())).toBe(false);
  });

  it("rejects other executable and local schemes", () => {
    for (const value of [
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "ftp://evil.tld/x",
      "ws://evil.tld",
      "wss://evil.tld",
      "chrome://settings",
      "about:blank",
      "view-source:https://app.example.com",
      "intent://evil#Intent;scheme=http;end",
    ]) {
      expect(ok(value, at()), value).toBe(false);
    }
  });
});

describe("checkUrl — the exfiltration case", () => {
  it("rejects a cross-origin URL carrying scope data", () => {
    const url = `https://evil.tld/log?d=${encodeURIComponent(
      JSON.stringify([{ name: "Ada", email: "ada@example.com" }]),
    )}`;
    const result = checkUrl(url, at());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("evil.tld");
  });

  it("rejects protocol-relative URLs, which are absolute", () => {
    expect(ok("//evil.tld/log?d=secret", at())).toBe(false);
    expect(ok("//evil.tld", at())).toBe(false);
  });

  it("allows same-origin absolute URLs", () => {
    expect(ok(`${ORIGIN}/img/logo.png`, at())).toBe(true);
  });

  it("rejects a look-alike host that merely starts with the origin host", () => {
    expect(ok("https://app.example.com.evil.tld/x", at())).toBe(false);
  });

  it("resolves userinfo the way the browser does — the host after @ wins", () => {
    expect(ok("https://app.example.com@evil.tld/", at())).toBe(false);
    expect(ok("https://evil.tld@app.example.com/", at())).toBe(true);
  });
});

describe("checkUrl — backslashes", () => {
  it("reads two leading slashes or backslashes as a host, as the URL parser does", () => {
    for (const value of ["\\\\evil.tld/x", "/\\evil.tld/x", "\\/evil.tld/x", "\\\\\\evil.tld/x", "/\\/\\evil.tld/x"]) {
      const result = checkUrl(value, at());
      expect(result.ok, JSON.stringify(value)).toBe(false);
      if (!result.ok) expect(result.reason).toContain("evil.tld");
    }
  });

  it("sees the host through tabs and newlines the parser drops", () => {
    for (const value of [
      "/\t/evil.tld/x",
      "\n//evil.tld/x",
      "/\n\\evil.tld/x",
      "\\\r\\evil.tld/x",
      " \t\\\\evil.tld",
    ]) {
      expect(ok(value, at()), JSON.stringify(value)).toBe(false);
    }
  });

  it("checks such a host like any absolute URL", () => {
    expect(ok("\\\\cdn.example.com/a.png", at({ hosts: ["cdn.example.com"] }))).toBe(true);
    expect(ok("/\\app.example.com/a.png", at())).toBe(true);
  });

  it("keeps a single backslash relative", () => {
    expect(ok("\\a.png", at())).toBe(true);
    expect(ok("a\\b.png", at())).toBe(true);
  });

  it("rejects backslashes after an http scheme", () => {
    expect(ok("https:\\\\evil.tld/x", at())).toBe(false);
    expect(ok("https:/\\evil.tld/x", at())).toBe(false);
  });

  it("agrees with the URL parser on every short prefix of slashes, backslashes and stripped characters", () => {
    const alphabet = ["/", "\\", "\t", "\n", " ", "\u0001", "a"];
    let prefixes = [""];
    const all: string[] = [];
    for (let length = 1; length <= 4; length++) {
      prefixes = prefixes.flatMap((prefix) => alphabet.map((char) => prefix + char));
      all.push(...prefixes);
    }
    for (const prefix of all) {
      const value = `${prefix}evil.tld/x`;
      let namesHost: boolean;
      try {
        namesHost = new URL(value, `${ORIGIN}/dir/`).host !== new URL(ORIGIN).host;
      } catch {
        namesHost = true;
      }
      expect(ok(value, at()), JSON.stringify(value)).toBe(!namesHost);
    }
  });
});

describe("checkUrl — relative URLs", () => {
  it("allows relative forms by default", () => {
    for (const value of ["/a/b.png", "a/b.png", "./a.png", "../a.png", "?q=1", "#x"]) {
      expect(ok(value, at()), value).toBe(true);
    }
  });

  it("can be switched off", () => {
    expect(ok("/a/b.png", at({ allowRelative: false }))).toBe(false);
  });

  it("passes an empty value — nothing is fetched", () => {
    expect(ok("", at())).toBe(true);
    expect(ok("   ", at())).toBe(true);
  });
});

describe("checkUrl — data: URLs", () => {
  it("allows raster images", () => {
    expect(ok("data:image/png;base64,iVBORw0KGgo=", at())).toBe(true);
    expect(ok("data:image/jpeg;base64,/9j/4AAQ", at())).toBe(true);
    expect(ok("data:image/webp,xx", at())).toBe(true);
  });

  it("rejects svg+xml even though it is an image — SVG can carry script", () => {
    expect(ok("data:image/svg+xml,<svg onload='alert(1)'></svg>", at())).toBe(false);
    expect(ok("data:image/svg+xml;base64,PHN2Zz4=", at())).toBe(false);
  });

  it("rejects non-image data URLs", () => {
    expect(ok("data:text/html,<script>alert(1)</script>", at())).toBe(false);
    expect(ok("data:application/javascript,alert(1)", at())).toBe(false);
    expect(ok("data:image/pngx,zz", at())).toBe(false);
  });

  it("can be switched off entirely", () => {
    expect(ok("data:image/png;base64,iVBORw0KGgo=", at({ allowDataImages: false }))).toBe(false);
  });
});

describe("checkUrl — host allow-list", () => {
  it("allows an exactly listed host", () => {
    expect(ok("https://cdn.example.com/a.png", at({ hosts: ["cdn.example.com"] }))).toBe(true);
  });

  it("does not allow a suffix look-alike of a listed host", () => {
    expect(ok("https://cdn.example.com.evil.tld/a.png", at({ hosts: ["cdn.example.com"] }))).toBe(false);
    expect(ok("https://evilcdn.example.com/a.png", at({ hosts: ["cdn.example.com"] }))).toBe(false);
  });

  it("matches subdomains under a wildcard, but not the bare domain", () => {
    const policy = at({ hosts: ["*.example.org"] });
    expect(ok("https://cdn.example.org/a.png", policy)).toBe(true);
    expect(ok("https://a.b.example.org/a.png", policy)).toBe(true);
    expect(ok("https://example.org/a.png", policy)).toBe(false);
    expect(ok("https://evilexample.org/a.png", policy)).toBe(false);
  });

  it("is case-insensitive on the host", () => {
    expect(ok("https://CDN.Example.com/a.png", at({ hosts: ["cdn.example.com"] }))).toBe(true);
  });
});

describe("checkUrl — inert schemes and predicates", () => {
  it("allows schemes that cannot fetch on their own", () => {
    expect(ok("mailto:a@example.com", at())).toBe(true);
    expect(ok("tel:+123456", at())).toBe(true);
    expect(ok("blob:https://app.example.com/uuid", at())).toBe(true);
  });

  it("hands the whole decision to a predicate policy", () => {
    const only = (url: string) => url.startsWith("https://ok.tld/");
    expect(ok("https://ok.tld/a.png", only)).toBe(true);
    expect(ok("https://evil.tld/a.png", only)).toBe(false);
    expect(ok("javascript:alert(1)", () => true)).toBe(true);
  });
});

describe("checkUrl — no origin available (SSR)", () => {
  const noOrigin: UrlPolicy = { hosts: ["cdn.example.com"] };
  it("still allows relative and allow-listed hosts", () => {
    expect(ok("/a.png", noOrigin)).toBe(true);
    expect(ok("https://cdn.example.com/a.png", noOrigin)).toBe(true);
  });
  it("rejects an absolute URL it cannot match to an origin", () => {
    expect(ok("https://anything.tld/a.png", noOrigin)).toBe(false);
  });
  it("reads an explicit origin written with a trailing slash", () => {
    expect(ok(`${ORIGIN}/a.png`, { origin: `${ORIGIN}/` })).toBe(true);
  });
});

describe("findUrlViolations", () => {
  const policy = at({ hosts: ["cdn.example.com"] });

  it("flags a top-level uri-format prop", () => {
    const schema = {
      type: "object" as const,
      properties: {
        src: { type: "string" as const, format: "uri" },
        alt: { type: "string" as const },
      },
    };
    expect(findUrlViolations(schema, { src: "https://evil.tld/x", alt: "hi" }, policy)).toEqual([
      { path: "src", url: "https://evil.tld/x", reason: expect.any(String) },
    ]);
  });

  it("ignores a non-URL prop that happens to contain a URL", () => {
    const schema = {
      type: "object" as const,
      properties: { text: { type: "string" as const } },
    };
    expect(findUrlViolations(schema, { text: "see https://evil.tld for more" }, policy)).toEqual([]);
  });

  it("walks into arrays of objects", () => {
    const schema = {
      type: "object" as const,
      properties: {
        items: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              src: { type: "string" as const, format: "uri" },
              name: { type: "string" as const },
            },
          },
        },
      },
    };
    const value = {
      items: [
        { src: "https://cdn.example.com/a.png", name: "ok" },
        { src: "https://evil.tld/beacon?d=1", name: "bad" },
      ],
    };
    const found = findUrlViolations(schema, value, policy);
    expect(found).toHaveLength(1);
    expect(found[0].path).toBe("items[1].src");
  });

  it("resolves $ref into $defs", () => {
    const schema = {
      type: "object" as const,
      $defs: {
        Node: {
          type: "object" as const,
          properties: { avatar: { type: "string" as const, format: "uri" } },
        },
      },
      properties: {
        nodes: { type: "array" as const, items: { $ref: "#/$defs/Node" } },
      },
    };
    const found = findUrlViolations(schema, { nodes: [{ avatar: "https://evil.tld/a.png" }] }, policy);
    expect(found).toHaveLength(1);
    expect(found[0].path).toBe("nodes[0].avatar");
  });

  it("checks a union branch that declares the URL format", () => {
    const schema = {
      type: "object" as const,
      properties: {
        src: {
          anyOf: [{ type: "string" as const, format: "uri" }, { type: "null" as const }],
        },
      },
    };
    expect(findUrlViolations(schema, { src: "https://evil.tld/x" }, policy)).toHaveLength(1);
    expect(findUrlViolations(schema, { src: null }, policy)).toHaveLength(0);
  });

  it("returns nothing for clean props, a missing schema, or absent values", () => {
    const schema = {
      type: "object" as const,
      properties: { src: { type: "string" as const, format: "uri" } },
    };
    expect(findUrlViolations(schema, { src: "/local.png" }, policy)).toEqual([]);
    expect(findUrlViolations(schema, {}, policy)).toEqual([]);
    expect(findUrlViolations(undefined, { src: "https://evil.tld" }, policy)).toEqual([]);
  });

  it("checks a URL at any depth of a recursive schema", () => {
    const schema = {
      type: "object" as const,
      $defs: {
        OrgNode: {
          type: "object" as const,
          properties: {
            avatar: { type: "string" as const, format: "uri-reference" },
            children: { type: "array" as const, items: { $ref: "#/$defs/OrgNode" } },
          },
        },
      },
      properties: { root: { $ref: "#/$defs/OrgNode" } },
    };
    const depth = 40;
    let node: Record<string, unknown> = { avatar: "https://evil.tld/deep.png" };
    for (let i = 0; i < depth; i++) node = { avatar: "/ok.png", children: [node] };
    const found = findUrlViolations(schema, { root: node }, policy);
    expect(found).toEqual([
      {
        path: `root${".children[0]".repeat(depth)}.avatar`,
        url: "https://evil.tld/deep.png",
        reason: expect.stringContaining("evil.tld"),
      },
    ]);
  });

  it("follows a root self-reference (`#`), as a top-level z.lazy emits", () => {
    const schema = {
      type: "object" as const,
      properties: {
        src: { type: "string" as const, format: "uri" },
        kids: { type: "array" as const, items: { $ref: "#" } },
      },
    };
    const value = { src: "/a.png", kids: [{ src: "/b.png", kids: [{ src: "https://evil.tld/c" }] }] };
    expect(findUrlViolations(schema, value, policy).map((v) => v.path)).toEqual(["kids[0].kids[0].src"]);
  });

  it("follows a chain of `$ref`s and ends on a `$ref` loop", () => {
    const schema = {
      type: "object" as const,
      $defs: {
        A: { $ref: "#/$defs/B" },
        B: { type: "object" as const, properties: { src: { type: "string" as const, format: "uri" } } },
        Loop1: { $ref: "#/$defs/Loop2" },
        Loop2: { $ref: "#/$defs/Loop1" },
      },
      properties: { a: { $ref: "#/$defs/A" }, loop: { $ref: "#/$defs/Loop1" } },
    };
    const found = findUrlViolations(schema, { a: { src: "https://evil.tld/x" }, loop: "x" }, policy);
    expect(found.map((v) => v.path)).toEqual(["a.src"]);
  });

  it("applies a `$ref` alongside the keywords next to it", () => {
    const schema = {
      type: "object" as const,
      $defs: {
        P: { type: "object" as const, properties: { src: { type: "string" as const, format: "uri" } } },
      },
      properties: {
        p: { type: "object" as const, properties: { name: { type: "string" as const } }, $ref: "#/$defs/P" },
      },
    };
    expect(findUrlViolations(schema, { p: { name: "n", src: "https://evil.tld/x" } }, policy)).toHaveLength(1);
  });

  it("walks tuples, including the items after the tuple", () => {
    const schema = {
      type: "object" as const,
      properties: {
        pair: {
          type: "array" as const,
          prefixItems: [{ type: "string" as const }, { type: "string" as const, format: "uri" }],
        },
        rest: {
          type: "array" as const,
          prefixItems: [{ type: "string" as const }],
          items: { type: "string" as const, format: "uri" },
        },
      },
    };
    const value = {
      pair: ["https://evil.tld/label-only", "https://evil.tld/a"],
      rest: ["https://evil.tld/label-only", "/ok.png", "https://evil.tld/b"],
    };
    expect(findUrlViolations(schema, value, policy).map((v) => v.path)).toEqual(["pair[1]", "rest[2]"]);
  });

  it("walks records: undeclared keys, pattern keys, and URL keys", () => {
    const schema = {
      type: "object" as const,
      properties: {
        byName: { type: "object" as const, additionalProperties: { type: "string" as const, format: "uri" } },
        mixed: {
          type: "object" as const,
          properties: { title: { type: "string" as const } },
          additionalProperties: { type: "string" as const, format: "uri" },
        },
        patterned: {
          type: "object" as const,
          patternProperties: { "^img": { type: "string" as const, format: "uri" } },
        },
        links: {
          type: "object" as const,
          propertyNames: { type: "string" as const, format: "uri" },
          additionalProperties: { type: "string" as const },
        },
      },
    };
    const value = {
      byName: { ada: "https://evil.tld/a" },
      mixed: { title: "https://evil.tld/text-only", logo: "https://evil.tld/b" },
      patterned: { img1: "https://evil.tld/c" },
      links: { "https://evil.tld/d": "a label" },
    };
    expect(findUrlViolations(schema, value, policy).map((v) => v.url)).toEqual([
      "https://evil.tld/a",
      "https://evil.tld/b",
      "https://evil.tld/c",
      "https://evil.tld/d",
    ]);
  });

  it("ends on a cyclic value", () => {
    const schema = {
      type: "object" as const,
      properties: { src: { type: "string" as const, format: "uri" }, self: { $ref: "#" } },
    };
    const value: Record<string, unknown> = { src: "https://evil.tld/x" };
    value.self = value;
    expect(findUrlViolations(schema, value, policy)).toHaveLength(1);
  });

  it("walks each value once per subschema, however many union branches reach it", () => {
    const branch = () => ({
      type: "object" as const,
      properties: { next: { $ref: "#/$defs/N" }, src: { type: "string" as const, format: "uri" } },
    });
    const schema = {
      $defs: { N: { anyOf: [branch(), branch(), branch()] } },
      $ref: "#/$defs/N",
    };
    const depth = 60;
    let value: Record<string, unknown> = { src: "https://evil.tld/x" };
    for (let i = 0; i < depth; i++) value = { src: "/ok.png", next: value };
    expect(findUrlViolations(schema, value, policy)).toHaveLength(1);
  });
});

describe("schemaHasUrlFormat", () => {
  it("finds a URL format at any depth, through `$ref`s", () => {
    let deep: Record<string, unknown> = { type: "string", format: "uri" };
    for (let i = 0; i < 40; i++) deep = { type: "object", properties: { a: deep } };
    expect(schemaHasUrlFormat(deep)).toBe(true);
    expect(
      schemaHasUrlFormat({
        properties: { a: { $ref: "#/$defs/A" } },
        $defs: { A: { properties: { b: { $ref: "#/$defs/B" } } }, B: { format: "uri-reference" } },
      }),
    ).toBe(true);
  });

  it("says no when no URL format is declared", () => {
    expect(schemaHasUrlFormat({ type: "object", properties: { text: { type: "string" } } })).toBe(false);
    expect(schemaHasUrlFormat(undefined)).toBe(false);
  });
});
