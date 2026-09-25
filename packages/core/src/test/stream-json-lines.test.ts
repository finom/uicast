import { describe, expect, it } from "vitest";
import { streamJsonLines } from "../stream-json-lines";

const encoder = new TextEncoder();

async function* chunks(parts: (string | Uint8Array)[]): AsyncGenerator<string | Uint8Array> {
  for (const part of parts) yield part;
}

const collect = async (
  source: ReadableStream<Uint8Array | string> | AsyncIterable<string | Uint8Array>,
): Promise<unknown[]> => {
  const out: unknown[] = [];
  for await (const value of streamJsonLines(source)) out.push(value);
  return out;
};

describe("streamJsonLines — chunk reassembly", () => {
  it("yields an entry split across chunks", async () => {
    expect(await collect(chunks(['{"a"', ':1}\n{"b":2}\n']))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("flushes the last line without a trailing newline", async () => {
    expect(await collect(chunks(['{"a":1}\n{"b"', ":2}"]))).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

describe("streamJsonLines — non-JSON noise", () => {
  it("drops fences, prose, and truncated lines", async () => {
    const parts = [
      "```json\n",
      "Here are the entries:\n",
      '{"key":"a","component":"C"}\n',
      '{"key":"b","compo\n',
      "```\n",
    ];
    expect(await collect(chunks(parts))).toEqual([{ key: "a", component: "C" }]);
  });

  it("tolerates CRLF line endings and blank lines", async () => {
    expect(await collect(chunks(['{"a":1}\r\n\r\n', '\n{"b":2}\r\n']))).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

describe("streamJsonLines — byte input", () => {
  it("decodes a multi-byte UTF-8 char split across Uint8Array chunks", async () => {
    const bytes = encoder.encode('{"s":"héllo"}');
    // Cut between the two bytes of "é" (0xC3 0xA9); also no trailing newline,
    // so the flush path decodes the tail.
    const cut = bytes.indexOf(0xc3) + 1;
    expect(await collect(chunks([bytes.slice(0, cut), bytes.slice(cut)]))).toEqual([{ s: "héllo" }]);
  });
});

describe("streamJsonLines — source kinds", () => {
  it("a ReadableStream yields the same entries as an async iterable", async () => {
    const parts: (string | Uint8Array)[] = ['{"a":1}\n', encoder.encode('{"b":2}\n'), '{"c":3}'];
    const stream = new ReadableStream<Uint8Array | string>({
      start(controller) {
        for (const part of parts) controller.enqueue(part);
        controller.close();
      },
    });
    const fromIterable = await collect(chunks(parts));
    expect(fromIterable).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(await collect(stream)).toEqual(fromIterable);
  });
});
