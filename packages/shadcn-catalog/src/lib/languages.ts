import z from "zod";

// Nothing is highlighted; this is the label vocabulary.
const LANGUAGES = [
	"bash", "c", "cpp", "csharp", "css", "diff", "docker", "go", "graphql", "html", "ini", "java",
	"javascript", "json", "jsx", "kotlin", "lua", "makefile", "markdown", "nginx", "php", "plaintext",
	"powershell", "python", "r", "ruby", "rust", "scss", "sql", "swift", "toml", "tsx", "typescript",
	"xml", "yaml",
] as const;

export const languageSchema = z.enum(LANGUAGES).meta({ id: "CodeLanguage" });
