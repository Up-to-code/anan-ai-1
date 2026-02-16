"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageViewer } from "./image-viewer";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;

function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url);
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-right leading-relaxed prose-invert",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mt-4 mb-2 text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-foreground/90 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-foreground/90">{children}</li>
          ),
          img: ({ src, alt }) => {
            const imgSrc = typeof src === "string" ? src : undefined;
            if (!imgSrc) return null;
            return (
              <div className="my-3">
                <ImageViewer src={imgSrc} alt={alt || "Image"} />
              </div>
            );
          },
          a: ({ href, children }) => {
            if (!href) return <>{children}</>;

            if (isImageUrl(href)) {
              return (
                <div className="my-3">
                  <ImageViewer
                    src={href}
                    alt={typeof children === "string" ? children : "Image"}
                  />
                </div>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {children}
              </a>
            );
          },
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code
                  className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-foreground/90"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "block bg-zinc-900 p-3 rounded-lg text-sm font-mono overflow-x-auto",
                  codeClassName,
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-zinc-900 p-3 rounded-lg overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-r-4 border-zinc-600 pr-4 my-3 text-foreground/80 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-zinc-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-700 px-3 py-2 bg-zinc-800 text-foreground font-semibold text-right">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-700 px-3 py-2 text-foreground/90 text-right">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
