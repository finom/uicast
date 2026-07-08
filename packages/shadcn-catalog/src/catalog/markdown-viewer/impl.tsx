import { Streamdown } from "streamdown";
import { createComponentImplementation } from "@ui-fired/react";
import { MarkdownViewerDef } from "./def";

// Rendering is delegated to streamdown: full GitHub-flavored Markdown with
// hardened defaults — source text never becomes raw HTML, so model- or
// user-supplied content can't inject markup.
export const MarkdownViewerImpl = createComponentImplementation({
  def: MarkdownViewerDef,
  render: ({ content, generatedKey }) => (
    <div data-key={generatedKey}>
      <Streamdown>{content}</Streamdown>
    </div>
  ),
});
