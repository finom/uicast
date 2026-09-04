import { Streamdown } from "streamdown";
import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { MarkdownViewerDef } from "./def";

// Rendering is delegated to streamdown: full GitHub-flavored Markdown with
// hardened defaults — source text never becomes raw HTML, so model- or
// user-supplied content can't inject markup.
export const MarkdownViewerImpl = createComponentImplementation({
  def: MarkdownViewerDef,
  render: ({ content}, { entry }) => (
    <div data-key={entry.key}>
      <Streamdown>{content}</Streamdown>
    </div>
  ),
  placeholder: () => <Skeleton className="w-full" style={{ height: 160 }} />,
});
