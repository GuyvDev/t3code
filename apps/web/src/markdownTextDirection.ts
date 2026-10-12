import { getTextDirection, type TextDirection } from "./lib/textDirection";

type HtmlNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
};

const DIRECTION_BLOCKS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "table",
  "th",
  "td",
  "summary",
]);

function proseText(node: HtmlNode): string {
  if (node.tagName === "code" || node.tagName === "pre") return "";
  if (node.type === "text") return node.value ?? "";
  return node.children?.map(proseText).join("") ?? "";
}

/** Runs after sanitization, so raw HTML and ordinary markdown share the policy. */
export function rehypeTextDirection() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode, inherited: TextDirection) => {
      if (node.tagName === "pre" || node.tagName === "code") {
        node.properties = { ...node.properties, dir: "ltr" };
        return;
      }
      let direction = inherited;
      if (node.tagName && DIRECTION_BLOCKS.has(node.tagName)) {
        direction = getTextDirection(proseText(node), inherited);
        node.properties = { ...node.properties, dir: direction, dataTextDirection: "" };

        // Hard breaks in prompts / markdown can separate different languages.
        // Give each visible line a block of its own without altering its text.
        if (
          (node.tagName === "p" || node.tagName === "li") &&
          node.children?.some((child) => child.tagName === "br") &&
          !node.children.some((child) => child.tagName && DIRECTION_BLOCKS.has(child.tagName))
        ) {
          const lines: HtmlNode[][] = [[]];
          for (const child of node.children) {
            if (child.tagName === "br") lines.push([]);
            else {
              const line = lines[lines.length - 1]!;
              // Markdown leaves a formatting newline after a hard break. The
              // retained <br> already carries it for selection and clipboard.
              line.push(
                lines.length > 1 && line.length === 0 && child.type === "text"
                  ? { ...child, value: (child.value ?? "").replace(/^\n/, "") }
                  : child,
              );
            }
          }
          const directions = lines.map((children) =>
            getTextDirection(children.map(proseText).join(""), direction),
          );
          if (directions.some((lineDirection) => lineDirection !== direction)) {
            node.children = lines.map((children, index) => ({
              type: "element",
              tagName: "span",
              properties: {
                dir: directions[index],
                dataTextDirection: "",
                dataTextDirectionLine: "",
              },
              children:
                index < lines.length - 1 || children.length === 0
                  ? [...children, { type: "element", tagName: "br", properties: {}, children: [] }]
                  : children,
            }));
          }
        }
      }
      node.children?.forEach((child) => visit(child, direction));
    };
    visit(tree, "ltr");
  };
}
