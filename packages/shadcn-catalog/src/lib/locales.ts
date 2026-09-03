import z from "zod";

// The currencies and locales CurrencyInput formats with — Intl accepts far more, but a document names one of these.
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN", "BRL", "MXN", "ZAR"] as const;
const LOCALES = ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT", "nl-NL", "pt-BR", "pl-PL", "sv-SE", "ja-JP", "zh-CN", "ko-KR", "hi-IN"] as const;

export const currencySchema = z.enum(CURRENCIES).meta({ id: "Currency" });
export const localeSchema = z.enum(LOCALES).meta({ id: "Locale" });
