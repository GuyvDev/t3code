import { useState, type ChangeEvent } from "react";
import { getTextDirection } from "~/lib/textDirection";

/** Applies the same policy to controlled values and edits in uncontrolled fields. */
export function useTextDirection<T extends HTMLInputElement | HTMLTextAreaElement>(props: {
  value?: unknown;
  defaultValue?: unknown;
  dir?: string | undefined;
}) {
  const [direction, setDirection] = useState(() =>
    getTextDirection(String(props.defaultValue ?? "")),
  );
  return {
    dir: props.dir ?? (props.value != null ? getTextDirection(String(props.value)) : direction),
    onChange: (event: ChangeEvent<T>) => {
      if (props.value == null) setDirection(getTextDirection(event.currentTarget.value));
    },
  };
}
