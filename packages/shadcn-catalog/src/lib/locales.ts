// biome-ignore-all format: the lists are grouped by kind, one group per line
import z from "zod";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN", "BRL", "MXN", "ZAR"] as const;
const LOCALES = ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT", "nl-NL", "pt-BR", "pl-PL", "sv-SE", "ja-JP", "zh-CN", "ko-KR", "hi-IN"] as const;

export const currencySchema = z.enum(CURRENCIES).meta({ id: "Currency" });
export const localeSchema = z.enum(LOCALES).meta({ id: "Locale" });
