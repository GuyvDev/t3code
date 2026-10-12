import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { getTextDirection, type TextDirection } from "~/lib/textDirection";

const PROSE_BLOCKS = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
]);

function proseText(node: Node): string {
  if (node.type.name === "codeBlock" || node.marks.some((mark) => mark.type.name === "code")) {
    return "";
  }
  if (node.isText) return node.text ?? "";
  let text = "";
  // Atomic file, skill and context chips aren't prose and don't choose direction.
  node.forEach((child) => (text += proseText(child)));
  return text;
}

function directionDecorations(doc: Node): DecorationSet {
  const decorations: Decoration[] = [];
  const directions = new Map<Node, TextDirection>();
  doc.descendants((node, pos, parent) => {
    if (node.type.name === "codeBlock") {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, { dir: "ltr" }, { direction: "ltr" }),
      );
      return false;
    }
    if (!PROSE_BLOCKS.has(node.type.name)) return;
    const direction = getTextDirection(
      proseText(node),
      (parent && directions.get(parent)) ?? "ltr",
    );
    directions.set(node, direction);
    decorations.push(
      Decoration.node(
        pos,
        pos + node.nodeSize,
        { dir: direction, "data-text-direction": "" },
        { direction },
      ),
    );
  });
  return DecorationSet.create(doc, decorations);
}

/** Derived decorations leave text, selection, serialization and undo history untouched. */
export function createComposerTextDirectionPlugin() {
  return new Plugin<DecorationSet>({
    state: {
      init: (_, state) => directionDecorations(state.doc),
      apply: (transaction, previous) =>
        transaction.docChanged ? directionDecorations(transaction.doc) : previous,
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

export const ComposerTextDirectionExtension = Extension.create({
  name: "composerTextDirection",
  addProseMirrorPlugins() {
    return [createComposerTextDirectionPlugin()];
  },
});
