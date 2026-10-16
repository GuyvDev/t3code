import { getSchema } from "@tiptap/core";
import { history, undo } from "@tiptap/pm/history";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vite-plus/test";
import { createComposerTextDirectionPlugin } from "./composerTextDirection";

const schema = getSchema([StarterKit]);

describe("composer text direction", () => {
  it("recomputes direction after edits and undo without changing text or selection", () => {
    const plugin = createComposerTextDirectionPlugin();
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("MAX - חברה אחת")]),
    ]);
    let state = EditorState.create({ schema, doc, plugins: [plugin, history()] });
    const directions = () =>
      plugin
        .getState(state)
        ?.find()
        .map((d) => d.spec.direction);
    expect(directions()).toEqual(["rtl"]);
    state = state.apply(state.tr.insertText("i want to go", 1, state.doc.content.size - 1));
    expect(directions()).toEqual(["ltr"]);
    expect(state.doc.textContent).toBe("i want to go");
    const selected = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 4)));
    expect(plugin.getState(selected)).toBe(plugin.getState(state));
    expect(selected.selection.from).toBe(4);
    state = selected;
    expect(undo(state, (tr) => (state = state.apply(tr)))).toBe(true);
    expect(state.doc.textContent).toBe("MAX - חברה אחת");
    expect(directions()).toEqual(["rtl"]);
  });

  it("handles nested languages and excludes inline and block code from prose", () => {
    const plugin = createComposerTextDirectionPlugin();
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("مرحبا بالعالم")]),
        schema.node("paragraph", null, [schema.text("i want to go")]),
      ]),
      schema.node("paragraph", null, [
        schema.text("שלום "),
        schema.text("aVeryLongEnglishIdentifier", [schema.mark("code")]),
      ]),
      schema.node("codeBlock", null, [schema.text('const greeting = "שלום";')]),
    ]);
    const state = EditorState.create({ schema, doc, plugins: [plugin] });
    expect(
      plugin
        .getState(state)
        ?.find()
        .map((d) => d.spec.direction),
    ).toEqual(["rtl", "rtl", "ltr", "rtl", "ltr"]);
    expect(state.doc).toBe(doc);
  });
});
