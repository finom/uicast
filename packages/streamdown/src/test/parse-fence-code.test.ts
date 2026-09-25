import { describe, expect, it } from "vitest";
import { parseFenceCode } from "../parse-fence-code";

describe("parseFenceCode", () => {
  it("parses one entry per line", () => {
    const code = [
      '{"key":"root","component":"Container","children":["a"]}',
      '{"key":"a","component":"Typography"}',
    ].join("\n");
    const entries = parseFenceCode(code, new Map());
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe("root");
    expect(entries[1].component).toBe("Typography");
  });

  it("skips the incomplete last line of a streaming fence", () => {
    const code = '{"key":"root","component":"Container"}\n{"key":"a","com';
    const entries = parseFenceCode(code, new Map());
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("root");
  });

  it("skips blank lines and non-entry JSON", () => {
    const code = ['{"key":"root","component":"C"}', "", '{"note":"not an entry"}', "42"].join("\n");
    expect(parseFenceCode(code, new Map())).toHaveLength(1);
  });

  it("returns [] for empty or prose-only content", () => {
    expect(parseFenceCode("", new Map())).toEqual([]);
    expect(parseFenceCode("just some text", new Map())).toEqual([]);
  });

  it("drops an entry whose children is not an array", () => {
    const code = [
      '{"key":"root","component":"C","children":"a"}',
      '{"key":"ok","component":"C","children":["a"]}',
    ].join("\n");
    const entries = parseFenceCode(code, new Map());
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("ok");
  });

  it("preserves duplicate-key lines in order (partial replacement)", () => {
    const code = [
      '{"key":"a","component":"C","props":{"literal":{"text":"v1"}}}',
      '{"key":"a","component":"C","props":{"literal":{"text":"v2"}}}',
    ].join("\n");
    const entries = parseFenceCode(code, new Map());
    expect(entries).toHaveLength(2);
    expect(entries[1].props).toEqual({ literal: { text: "v2" } });
  });

  it("keeps entry identity stable across streaming re-parses via the cache", () => {
    const cache = new Map();
    const line1 = '{"key":"root","component":"Container","children":["a"]}';
    const line2 = '{"key":"a","component":"Typography"}';
    const first = parseFenceCode(line1, cache);
    const second = parseFenceCode(`${line1}\n${line2}`, cache);
    expect(second[0]).toBe(first[0]);
    expect(second).toHaveLength(2);
    expect(parseFenceCode(line1, new Map())[0]).not.toBe(first[0]);
  });
});
