"use client";

import React, { useState } from "react";

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!content) return null;

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline markdown (bold, code, citations, links) with unique key prefixes
  const renderInline = (text: string, prefix: string) => {
    // 1. Split on inline code (`code`)
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((part, pIdx) => {
      const codeKey = `${prefix}-c${pIdx}`;
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={codeKey}
            className="font-mono text-[11px] bg-white/[0.08] text-primary px-1.5 py-0.5 rounded border border-white/[0.06] font-medium"
          >
            {codeText}
          </code>
        );
      }

      // 2. Split on bold (**text**)
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);

      return boldParts.map((bPart, bIdx) => {
        const boldKey = `${codeKey}-b${bIdx}`;
        if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
          return (
            <strong key={boldKey} className="font-semibold text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        // 3. Highlight citation patterns like [src/path:12-40]
        const citationParts = bPart.split(/(\[[a-zA-Z0-9_\-./]+:\d+(?:–\d+|-?\d+)?\])/g);

        return citationParts.map((cPart, cIdx) => {
          const citKey = `${boldKey}-cit${cIdx}`;
          if (cPart.startsWith("[") && cPart.endsWith("]") && cPart.includes(":")) {
            return (
              <span
                key={citKey}
                className="font-mono text-[10px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20 mx-0.5"
              >
                {cPart}
              </span>
            );
          }
          return <span key={citKey}>{cPart}</span>;
        });
      });
    });
  };

  // Helper to render markdown tables with unique keys
  const renderTable = (tableLines: string[], tableKey: string) => {
    const headerLine = tableLines[0];
    const dataLines = tableLines.slice(2); // Skip header and separator |---|---|

    const headers = headerLine
      .split("|")
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    return (
      <div key={tableKey} className="my-3 overflow-x-auto rounded-xl border border-white/[0.1] bg-surface-container-lowest/60 shadow-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white/[0.06] border-b border-white/[0.1]">
              {headers.map((h, hIdx) => (
                <th
                  key={`${tableKey}-th-${hIdx}`}
                  className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-on-background uppercase tracking-wider"
                >
                  {renderInline(h, `${tableKey}-th-${hIdx}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {dataLines.map((line, rIdx) => {
              const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

              return (
                <tr
                  key={`${tableKey}-tr-${rIdx}`}
                  className="hover:bg-white/[0.03] transition-colors odd:bg-transparent even:bg-white/[0.01]"
                >
                  {cells.map((cell, cIdx) => (
                    <td key={`${tableKey}-td-${rIdx}-${cIdx}`} className="px-3.5 py-2.5 text-text-secondary leading-relaxed">
                      {renderInline(cell, `${tableKey}-td-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Split content by code blocks and parse line by line
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-on-background">
      {blocks.map((block, blockIndex) => {
        const blockPrefix = `blk-${blockIndex}`;

        // 1. Code Block Handler
        if (block.startsWith("```") && block.endsWith("```")) {
          const raw = block.slice(3, -3);
          const firstNewline = raw.indexOf("\n");
          const language = firstNewline !== -1 ? raw.slice(0, firstNewline).trim() : "";
          const code = firstNewline !== -1 ? raw.slice(firstNewline + 1) : raw;

          return (
            <div
              key={blockPrefix}
              className="my-3 rounded-xl overflow-hidden bg-surface-container-lowest border border-white/[0.1] font-mono text-xs shadow-inner group"
            >
              <div className="bg-white/[0.04] border-b border-white/[0.06] px-3.5 py-1.5 text-[11px] text-text-secondary flex items-center justify-between">
                <span className="font-semibold text-on-background uppercase tracking-wider text-[10px]">
                  {language || "code"}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(code, blockIndex)}
                  className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-primary transition-colors cursor-pointer bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]"
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {copiedIndex === blockIndex ? "check" : "content_copy"}
                  </span>
                  <span>{copiedIndex === blockIndex ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-on-background leading-relaxed selection:bg-primary/20">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // 2. Prose / Table / Header Handler
        const lines = block.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let tableBuffer: string[] = [];

        const flushTable = (index: number) => {
          const tableKey = `${blockPrefix}-tbl-${index}`;
          if (tableBuffer.length >= 2) {
            renderedElements.push(renderTable(tableBuffer, tableKey));
          } else {
            tableBuffer.forEach((tLine, tIdx) => {
              renderedElements.push(
                <p key={`${tableKey}-p-${tIdx}`} className="leading-relaxed">
                  {renderInline(tLine, `${tableKey}-p-${tIdx}`)}
                </p>
              );
            });
          }
          tableBuffer = [];
        };

        lines.forEach((line, lineIdx) => {
          const lineKey = `${blockPrefix}-ln-${lineIdx}`;
          const trimmed = line.trim();

          // Table Line Detection
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            tableBuffer.push(trimmed);
            return;
          }

          // If we had a buffered table and current line is not table, flush it
          if (tableBuffer.length > 0) {
            flushTable(lineIdx);
          }

          // Horizontal Rule
          if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            renderedElements.push(
              <hr key={lineKey} className="border-t border-white/[0.08] my-3.5" />
            );
            return;
          }

          // Headings
          if (trimmed.startsWith("#### ")) {
            renderedElements.push(
              <h4
                key={lineKey}
                className="text-xs font-bold text-secondary mt-3.5 mb-1 font-mono tracking-tight flex items-center gap-1.5"
              >
                {renderInline(trimmed.slice(5), `${lineKey}-h4`)}
              </h4>
            );
            return;
          }

          if (trimmed.startsWith("### ")) {
            renderedElements.push(
              <h3
                key={lineKey}
                className="text-sm font-bold text-white mt-4 mb-1.5 tracking-tight flex items-center gap-1.5"
              >
                {renderInline(trimmed.slice(4), `${lineKey}-h3`)}
              </h3>
            );
            return;
          }

          if (trimmed.startsWith("## ")) {
            renderedElements.push(
              <h2
                key={lineKey}
                className="text-base font-extrabold text-primary mt-5 mb-2 tracking-tight border-b border-white/[0.06] pb-1"
              >
                {renderInline(trimmed.slice(3), `${lineKey}-h2`)}
              </h2>
            );
            return;
          }

          if (trimmed.startsWith("# ")) {
            renderedElements.push(
              <h1
                key={lineKey}
                className="text-lg font-black text-white mt-5 mb-2.5 tracking-tight"
              >
                {renderInline(trimmed.slice(2), `${lineKey}-h1`)}
              </h1>
            );
            return;
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            renderedElements.push(
              <blockquote
                key={lineKey}
                className="border-l-2 border-primary bg-white/[0.03] pl-3 py-1.5 my-2 rounded-r-lg text-text-secondary italic text-xs leading-relaxed"
              >
                {renderInline(trimmed.slice(2), `${lineKey}-bq`)}
              </blockquote>
            );
            return;
          }

          // List Items
          if (
            trimmed.startsWith("- ") ||
            trimmed.startsWith("* ") ||
            trimmed.startsWith("• ") ||
            /^\d+\.\s/.test(trimmed)
          ) {
            const bulletContent = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, "");
            return renderedElements.push(
              <div
                key={lineKey}
                className="flex items-start gap-2 ml-1 my-0.5 leading-relaxed text-on-background"
              >
                <span className="text-primary select-none text-[10px] mt-0.5">●</span>
                <div className="flex-1">{renderInline(bulletContent, `${lineKey}-li`)}</div>
              </div>
            );
          }

          // Empty Line (paragraph break)
          if (trimmed === "") {
            renderedElements.push(<div key={lineKey} className="h-1.5" />);
            return;
          }

          // Default Paragraph Line
          renderedElements.push(
            <p key={lineKey} className="leading-relaxed">
              {renderInline(line, `${lineKey}-p`)}
            </p>
          );
        });

        // Flush any remaining table at the end of block
        if (tableBuffer.length > 0) {
          flushTable(lines.length);
        }

        return <div key={blockPrefix}>{renderedElements}</div>;
      })}
    </div>
  );
}
