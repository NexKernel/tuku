import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

/** Renderiza Markdown con soporte matemático (LaTeX vía KaTeX). */
export function MathMarkdown({ content, className }: Props) {
  return (
    <div
      className={cn(
        "space-y-2.5 text-base leading-relaxed [&_code]:rounded [&_code]:bg-brand-500/10 [&_code]:px-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_strong]:font-extrabold [&_strong]:text-brand-700 dark:[&_strong]:text-brand-300",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  );
}
