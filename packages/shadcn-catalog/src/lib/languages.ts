import z from "zod";

// The languages CodeBlock and CodeEditor label. Nothing is highlighted, so this is the label vocabulary, not a parser list.
const LANGUAGES = [
	"bash", "c", "cpp", "csharp", "css", "diff", "docker", "go", "graphql", "html", "ini", "java",
	"javascript", "json", "jsx", "kotlin", "lua", "makefile", "markdown", "nginx", "php", "plaintext",
	"powershell", "python", "r", "ruby", "rust", "scss", "sql", "swift", "toml", "tsx", "typescript",
	"xml", "yaml",
] as const;

export const languageSchema = z.enum(LANGUAGES).meta({ id: "CodeLanguage" });
