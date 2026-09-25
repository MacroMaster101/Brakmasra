// Client-safe phone helpers for the signup and profile forms. Numbers are
// stored in E.164 form (+94771234567) with the chosen country code alongside.

export type PhoneCountry = {
  code: string;
  dial: string;
  name: string;
  /** Placeholder shown in the number field, formatted the local way. */
  example: string;
  /** Allowed length of the national number, without the leading 0. */
  digits: [min: number, max: number];
};

// Sri Lanka first, then the countries BRAKMASRA's audience most often lives in.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "LK", dial: "+94", name: "Sri Lanka", example: "77 123 4567", digits: [9, 9] },
  { code: "IN", dial: "+91", name: "India", example: "98765 43210", digits: [10, 10] },
  { code: "MV", dial: "+960", name: "Maldives", example: "771 2345", digits: [7, 7] },
  { code: "AE", dial: "+971", name: "United Arab Emirates", example: "50 123 4567", digits: [9, 9] },
  { code: "SA", dial: "+966", name: "Saudi Arabia", example: "51 234 5678", digits: [9, 9] },
  { code: "QA", dial: "+974", name: "Qatar", example: "3312 3456", digits: [8, 8] },
  { code: "KW", dial: "+965", name: "Kuwait", example: "500 12345", digits: [8, 8] },
  { code: "OM", dial: "+968", name: "Oman", example: "9212 3456", digits: [8, 8] },
  { code: "BH", dial: "+973", name: "Bahrain", example: "3600 1234", digits: [8, 8] },
  { code: "SG", dial: "+65", name: "Singapore", example: "8123 4567", digits: [8, 8] },
  { code: "MY", dial: "+60", name: "Malaysia", example: "12 345 6789", digits: [9, 10] },
  { code: "JP", dial: "+81", name: "Japan", example: "90 1234 5678", digits: [10, 10] },
  { code: "KR", dial: "+82", name: "South Korea", example: "10 1234 5678", digits: [9, 10] },
  { code: "AU", dial: "+61", name: "Australia", example: "412 345 678", digits: [9, 9] },
  { code: "NZ", dial: "+64", name: "New Zealand", example: "21 123 4567", digits: [8, 10] },
  { code: "GB", dial: "+44", name: "United Kingdom", example: "7400 123456", digits: [10, 10] },
  { code: "IT", dial: "+39", name: "Italy", example: "312 345 6789", digits: [9, 10] },
  { code: "DE", dial: "+49", name: "Germany", example: "1512 3456789", digits: [10, 11] },
  { code: "FR", dial: "+33", name: "France", example: "6 12 34 56 78", digits: [9, 9] },
  { code: "CA", dial: "+1", name: "Canada", example: "506 234 5678", digits: [10, 10] },
  { code: "US", dial: "+1", name: "United States", example: "201 555 0123", digits: [10, 10] },
];

export const DEFAULT_PHONE_COUNTRY = "LK";

export function findPhoneCountry(code: string | null | undefined) {
  return PHONE_COUNTRIES.find((country) => country.code === code);
}

/**
 * Turns what a visitor typed into E.164, or null when it is not a plausible
 * number for that country. Spaces, dashes, brackets, a trunk "0", and a
 * repeated country code are all accepted.
 */
export function normalizePhone(countryCode: string, raw: string): string | null {
  const country = findPhoneCountry(countryCode);
  if (!country) return null;
  const dialDigits = country.dial.slice(1);
  let digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") || raw.trim().startsWith("00")) {
    digits = digits.replace(/^00/, "");
    if (!digits.startsWith(dialDigits)) return null;
    digits = digits.slice(dialDigits.length);
  }
  digits = digits.replace(/^0/, "");
  const [min, max] = country.digits;
  if (digits.length < min || digits.length > max) return null;
  return `${country.dial}${digits}`;
}

/** The national part of a stored E.164 number, for pre-filling the field. */
export function nationalNumber(e164: string | null | undefined, countryCode: string | null | undefined) {
  const country = findPhoneCountry(countryCode);
  if (!e164 || !country || !e164.startsWith(country.dial)) return "";
  return e164.slice(country.dial.length);
}
