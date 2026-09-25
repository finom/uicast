/**
 * Yields each line of a byte or text stream that parses as JSON. Skips blank and non-JSON lines: code fences, prose,
 * a cut-off last line.
 *
 * @example
 * for await (const value of streamJsonLines(result.textStream)) {
 *   if (isComponentEntry(value)) await saveEntry(value);
 * }
 *
 * @example
 * if (!res.body) throw new Error(`Generation failed (${res.status})`);
 * const entries = streamJsonLines<ComponentEntry>(res.body);
 */
export async function* streamJsonLines<T = unknown>(
  source: ReadableStream<Uint8Array | string> | AsyncIterable<string | Uint8Array>,
): AsyncGenerator<T> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of toAsyncIterable(source)) {
    buffer += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });

    let nl = buffer.indexOf("\n");
    while (nl !== -1) {
      yield* parseLine<T>(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf("\n");
    }
  }

  yield* parseLine<T>(buffer + decoder.decode());
}

function* parseLine<T>(raw: string): Generator<T> {
  const line = raw.trim();
  if (!line) return;
  try {
    yield JSON.parse(line) as T;
  } catch {}
}

function toAsyncIterable(
  source: ReadableStream<Uint8Array | string> | AsyncIterable<string | Uint8Array>,
): AsyncIterable<string | Uint8Array> {
  if (Symbol.asyncIterator in source) {
    return source as AsyncIterable<string | Uint8Array>;
  }
  // Not every browser's ReadableStream is async-iterable.
  const stream = source as ReadableStream<Uint8Array | string>;
  return {
    async *[Symbol.asyncIterator]() {
      const reader = stream.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
