import z from "zod";

// The calling codes PhoneInput offers, and the country each belongs to.
export const CALLING_CODES = {
	"+1": "US", "+7": "RU", "+33": "FR", "+34": "ES", "+39": "IT", "+44": "UK", "+49": "DE",
	"+52": "MX", "+55": "BR", "+61": "AU", "+65": "SG", "+81": "JP", "+82": "KR", "+86": "CN",
	"+91": "IN", "+971": "AE",
} as const;

export type CallingCode = keyof typeof CALLING_CODES;

export const callingCodeSchema = z
	.enum(Object.keys(CALLING_CODES) as [CallingCode, ...CallingCode[]])
	.meta({ id: "CallingCode" });
