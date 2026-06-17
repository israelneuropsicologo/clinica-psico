import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm space-y-1 mb-2 pl-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm space-y-1 mb-2 pl-2">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-3" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
