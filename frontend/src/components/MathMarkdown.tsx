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
        "prose-preu space-y-3 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-brand-500/10 [&_code]:px-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-brand-400",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  );
}
