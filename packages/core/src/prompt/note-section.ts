export const noteSection = (note: string | undefined): string =>
	note?.trim() ? `## Note\n\n${note.trim()}` : "";
