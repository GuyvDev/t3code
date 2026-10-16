import { describe, expect, it } from "vite-plus/test";
import { rehypeTextDirection } from "./markdownTextDirection";

type HtmlNode = Parameters<ReturnType<typeof rehypeTextDirection>>[0];
const text = (value: string): HtmlNode => ({ type: "text", value });
const element = (tagName: string, children: HtmlNode[]): HtmlNode => ({
  type: "element",
  tagName,
  properties: {},
  children,
});

describe("markdown text direction", () => {
  it("separates mixed hard-break lines without losing text or clipboard breaks", () => {
    const paragraph = element("p", [
      text("חברות כרטיסי אשראי"),
      element("br", []),
      text("\nMAX - חברה אחת"),
      element("br", []),
      text("\ni want to go"),
    ]);
    rehypeTextDirection()(element("div", [paragraph]));
    expect(paragraph.children?.map((line) => line.properties?.dir)).toEqual(["rtl", "rtl", "ltr"]);
    expect(paragraph.children?.flatMap((line) => line.children ?? [])).toEqual([
      text("חברות כרטיסי אשראי"),
      element("br", []),
      text("MAX - חברה אחת"),
      element("br", []),
      text("i want to go"),
    ]);
  });

  it("ignores code in prose while preserving cell alignment and neutral context", () => {
    const inlineCode = element("code", [text("aVeryLongEnglishIdentifier")]);
    const paragraph = element("p", [text("שָׁלוֹם "), inlineCode]);
    const neutral = element("td", [text("123 😀")]);
    const arabic = element("th", [text("مرحبا بالعالم")]);
    arabic.properties = { align: "right" };
    const table = element("table", [element("tr", [arabic, neutral])]);
    rehypeTextDirection()(element("div", [paragraph, table]));
    expect(paragraph.properties?.dir).toBe("rtl");
    expect(inlineCode.properties?.dir).toBe("ltr");
    expect(neutral.properties?.dir).toBe("rtl");
    expect(arabic.properties?.align).toBe("right");
  });
});
