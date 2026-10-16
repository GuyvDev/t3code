import { describe, expect, it } from "vite-plus/test";
import { getTextDirection, hasRtlText } from "./textDirection";

describe("getTextDirection", () => {
  it.each([
    ["חברות כרטיסי אשראי", "rtl"],
    ["MAX - חברה אחת", "rtl"],
    ["HIT - חברה שניה", "rtl"],
    ["1. MAX - חברה אחת", "rtl"],
    ["2026: חברות כרטיסי אשראי", "rtl"],
    ["i want to go", "ltr"],
    ['"i want to go"', "ltr"],
    ["I want to go to תל אביב", "ltr"],
    ["مرحبا بالعالم", "rtl"],
    ["API - مرحبا بالعالم", "rtl"],
    ["שָׁלוֹם", "rtl"],
    ["עברית ١٢٣ ۱۲۳ 123 😀", "rtl"],
    ["中文、日本語、한국어", "ltr"],
    ["𞤀𞤁𞤂", "rtl"],
    ["שׁלום", "rtl"],
    ["abc אבג", "ltr"],
    ["אבג abc", "rtl"],
    ["\u200fhello\u202e", "ltr"],
  ])("chooses %s → %s without model or locale dependencies", (text, expected) => {
    expect(getTextDirection(text)).toBe(expected);
  });

  it("inherits direction for neutral content and ignores combining marks", () => {
    expect(getTextDirection("123 🙂!?", "rtl")).toBe("rtl");
    expect(getTextDirection("", "rtl")).toBe("rtl");
    expect(getTextDirection("\u05b0\u05b1abc")).toBe("ltr");
    expect(getTextDirection("123 🙂!?")).toBe("ltr");
  });

  it("identifies mixed documents needing native bidi cursor handling", () => {
    expect(hasRtlText('const greeting = "שלום";')).toBe(true);
    expect(hasRtlText("𞤀")).toBe(true);
    expect(hasRtlText("hello ١٢٣\u200f")).toBe(false);
  });
});
