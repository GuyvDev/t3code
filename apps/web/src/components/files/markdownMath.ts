import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

export const MARKDOWN_MATH_REMARK_PLUGINS: PluggableList = [remarkMath];

export const MARKDOWN_MATH_REHYPE_PLUGINS: PluggableList = [
  [rehypeKatex, { trust: false, throwOnError: false }],
];
