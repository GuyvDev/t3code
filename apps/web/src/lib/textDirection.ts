export type TextDirection = "ltr" | "rtl";

const LETTER = /\p{Letter}/u;
// Unicode RTL script blocks, including presentation forms and supplementary
// scripts (Adlam, historic scripts, and Arabic mathematical letters). Only
// letters are counted, so digits, combining marks, and bidi controls are neutral.
const RTL_LETTER =
  /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]/u;

/**
 * Pick a base direction from the balance of letters, rather than the first
 * character alone: "MAX - חברה אחת" is RTL. Ties use the first letter; neutral
 * text inherits its context. The browser's Unicode bidi algorithm still owns
 * character ordering. This function never changes or inserts text.
 */
export function getTextDirection(text: string, fallback: TextDirection = "ltr"): TextDirection {
  let balance = 0;
  let first: TextDirection | undefined;
  for (const character of text) {
    if (!LETTER.test(character)) continue;
    const direction = RTL_LETTER.test(character) ? "rtl" : "ltr";
    first ??= direction;
    balance += direction === "rtl" ? 1 : -1;
  }
  return balance > 0 ? "rtl" : balance < 0 ? "ltr" : (first ?? fallback);
}

export function hasRtlText(text: string): boolean {
  for (const character of text) {
    if (LETTER.test(character) && RTL_LETTER.test(character)) return true;
  }
  return false;
}
