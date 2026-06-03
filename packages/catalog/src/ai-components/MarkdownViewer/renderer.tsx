import { createAIComponentRenderer } from "@ui-fired/react";
import { MarkdownViewerDef } from "./def";

function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="underline text-primary">$1</a>',
    )
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");

  html = html.replace(
    /(<li>.*<\/li>\n?)+/g,
    (match) => `<ul class="list-disc pl-6">${match}</ul>`,
  );
  html = html.replace(/^(?!<[h|u|o|l])(.*\S.*)$/gm, "<p>$1</p>");

  return html;
}

export const MarkdownViewerRenderer = createAIComponentRenderer({
  def: MarkdownViewerDef,
  renderer: ({ content, generatedKey }) => {
    const html = simpleMarkdownToHtml(content);

    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
        data-key={generatedKey}
      />
    );
  },
});
