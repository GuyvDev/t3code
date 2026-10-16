import { getTextDirection, hasRtlText } from "~/lib/textDirection";

export const FILE_TEXT_DIRECTION_CSS = `
  [data-line][dir] {
    text-align: start;
    unicode-bidi: isolate;
  }
  /* Pierre measures its overlays from the left edge. Native selection/carets
     follow the browser's bidi layout for mixed-script documents instead. */
  :host([data-native-text-selection]) [data-content] {
    caret-color: var(--diffs-fg) !important;
  }
  :host([data-native-text-selection]) [data-content] ::selection {
    background-color: var(--diffs-editor-selection-bg) !important;
  }
  :host([data-native-text-selection]) [data-editor-overlay] {
    display: none !important;
  }
`;

type DirectionBinding = {
  update: (contents: string, fileName: string) => void;
  dispose: () => void;
  content: HTMLElement;
};
const bindings = new WeakMap<HTMLElement, DirectionBinding>();

export function disposeFileTextDirection(container: HTMLElement): void {
  bindings.get(container)?.dispose();
  bindings.delete(container);
}

export function updateFileTextDirection(
  container: HTMLElement,
  contents: string,
  fileName: string,
): void {
  const root = container.shadowRoot ?? container;
  const content = root.querySelector<HTMLElement>("[data-content]");
  if (!content) return;
  container.toggleAttribute("data-native-text-selection", hasRtlText(contents));

  const existing = bindings.get(container);
  if (existing?.content === content) {
    existing.update(contents, fileName);
    return;
  }
  disposeFileTextDirection(container);

  let smartAlignment = false;
  const updateLines = () => {
    for (const line of content.querySelectorAll<HTMLElement>("[data-line]")) {
      const direction = smartAlignment ? getTextDirection(line.textContent ?? "") : "ltr";
      if (line.dir !== direction) line.dir = direction;
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      container.hasAttribute("data-native-text-selection") &&
      /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(event.key) &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.isComposing
    ) {
      // Preserve the browser default, including Shift selection, while bypassing
      // the editor's logical (LTR) cursor movement. Its selectionchange listener
      // keeps logical offsets and subsequent edits in sync.
      event.stopImmediatePropagation();
    }
  };
  content.addEventListener("keydown", onKeyDown, true);
  const observer = new MutationObserver(updateLines);
  observer.observe(content, { childList: true, characterData: true, subtree: true });
  bindings.set(container, {
    content,
    update: (text, name) => {
      // Source code keeps its syntax in LTR context. Prose files align each
      // line independently; browser bidi ordering still handles Hebrew strings
      // in source code, with a native caret whenever RTL letters are present.
      smartAlignment = /\.(?:md|markdown|mdx|txt|text|rst|adoc|asciidoc|org)$/i.test(name);
      container.toggleAttribute("data-native-text-selection", hasRtlText(text));
      updateLines();
    },
    dispose: () => {
      observer.disconnect();
      content.removeEventListener("keydown", onKeyDown, true);
    },
  });
  bindings.get(container)!.update(contents, fileName);
}
