import { File, type FileOptions, Virtualizer } from "@pierre/diffs/react";
import { useCallback } from "react";

import { DiffWorkerPoolProvider } from "~/components/DiffWorkerPoolProvider";
import { useClientSettings } from "~/hooks/useSettings";
import { useTheme } from "~/hooks/useTheme";
import { resolveDiffThemeName } from "~/lib/diffRendering";
import { PREFERRED_HIGHLIGHTER } from "~/lib/syntaxHighlighting";

import { FILE_LINK_REVEAL_UNSAFE_CSS } from "./fileSurfaceChrome";
import { disposeFileTextDirection, updateFileTextDirection } from "./fileTextDirection";

export default function ReadOnlySourcePreview(props: {
  readonly name: string;
  readonly text: string;
  readonly cacheKey?: string;
  readonly onPostRender?: FileOptions<unknown, undefined>["onPostRender"];
}) {
  const { resolvedTheme } = useTheme();
  const wordWrap = useClientSettings((settings) => settings.wordWrap);
  const onPostRender = useCallback<NonNullable<FileOptions<unknown, undefined>["onPostRender"]>>(
    (container, instance, phase) => {
      if (phase === "unmount") disposeFileTextDirection(container);
      else updateFileTextDirection(container, instance.file?.contents ?? "", props.name);
      props.onPostRender?.(container, instance, phase);
    },
    [props.name, props.onPostRender],
  );
  return (
    <DiffWorkerPoolProvider>
      <Virtualizer
        key={`${props.name}:${resolvedTheme}:${props.text.length}`}
        className="file-preview-virtualizer min-h-0 flex-1 overflow-auto"
        config={{ overscrollSize: 600, intersectionObserverMargin: 1200 }}
      >
        <File
          file={{
            name: props.name,
            contents: props.text,
            ...(props.cacheKey ? { cacheKey: props.cacheKey } : {}),
          }}
          options={{
            disableFileHeader: true,
            overflow: wordWrap ? "wrap" : "scroll",
            theme: resolveDiffThemeName(resolvedTheme),
            preferredHighlighter: PREFERRED_HIGHLIGHTER,
            themeType: resolvedTheme,
            unsafeCSS: FILE_LINK_REVEAL_UNSAFE_CSS,
            onPostRender,
          }}
          className="min-h-full"
        />
      </Virtualizer>
    </DiffWorkerPoolProvider>
  );
}
