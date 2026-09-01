/** A partial's optional `note`, rendered as a trailing `## Note` section, verbatim. Copied per package. */
export const noteSection = (note: string | undefined): string =>
	note?.trim() ? `## Note\n\n${note.trim()}` : "";
