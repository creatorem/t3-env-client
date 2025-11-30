"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

const DEFAULT_WRAPPER_CLASSNAMES = {
  envComment: "text-green-700 italic",
  envVarName: "text-sky-700",
  envVarNameFailed: "text-red-600",
  envEquals: "text-neutral-800",
  envValue: "text-amber-600",
};

interface TextPart {
  type: "text";
  content: string;
}

interface WrapperPart {
  type: "wrapper";
  content: string;
  tagName: string;
  className: string;
}

type CodePart = TextPart | WrapperPart;

const CodeWithHighlighting: React.FC<{
  strongLineNumbers: number[];
  codeText: string;
  wrapperClassNames: Record<string, string>;
  textSize: "sm" | "md";
  topLineNumber: number;
  disableScroll: boolean;
  strongLineClassName?: string;
  lineClassName?: string;
}> = ({
  strongLineNumbers,
  codeText,
  wrapperClassNames,
  textSize,
  topLineNumber,
  disableScroll,
  strongLineClassName,
  lineClassName,
}) => {
  // Split code into lines for proper rendering
  // const codeLines = codeText.split('\n').slice(disableScroll ? topLineNumber - 1 : 0);
  const codeLines = codeText.split("\n");

  return codeLines.map((line: string, lineIndex: number) => {
    // Check if this line represents an unset environment variable
    const isUnsetEnvVar =
      line.includes("=") &&
      !line.startsWith("#") &&
      (line.endsWith("=") ||
        line.endsWith('=""') ||
        line.endsWith("=''") ||
        line.match(/=\s*$/)); // ends with = followed by optional whitespace

    // Parse each line for wrapper tags or env file syntax
    const parts: CodePart[] = [];
    let currentIndex = 0;

    // Check if this is an env file line (comment or KEY=value)
    if (line.startsWith("#")) {
      // Comment line
      parts.push({
        type: "wrapper",
        tagName: "envComment",
        content: line,
        className: wrapperClassNames["envComment"] || "",
      } as WrapperPart);
    } else if (line.includes("=") && !line.match(/<\w+>/)) {
      // Environment variable line (no existing tags)
      const equalIndex = line.indexOf("=");
      if (equalIndex > 0) {
        // Variable name
        const varName = line.substring(0, equalIndex);
        parts.push({
          type: "wrapper",
          tagName: isUnsetEnvVar ? "envVarNameFailed" : "envVarName",
          content: varName,
          className:
            wrapperClassNames[
              isUnsetEnvVar ? "envVarNameFailed" : "envVarName"
            ] || "",
        } as WrapperPart);

        // Equals sign
        parts.push({
          type: "wrapper",
          tagName: "envEquals",
          content: "=",
          className: wrapperClassNames["envEquals"] || "",
        } as WrapperPart);

        // Value (everything after =, wrapped in quotes for display)
        const value = line.substring(equalIndex + 1);
        if (value) {
          // Check if value already has quotes
          const hasQuotes =
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"));
          parts.push({
            type: "wrapper",
            tagName: "envValue",
            content: hasQuotes ? value : `"${value}"`,
            className: wrapperClassNames["envValue"] || "",
          } as WrapperPart);
        } else {
          // Empty value
          parts.push({
            type: "wrapper",
            tagName: "envValue",
            content: '""',
            className: wrapperClassNames["envValue"] || "",
          } as WrapperPart);
        }
      } else {
        // Fallback for malformed lines
        parts.push({
          type: "text",
          content: line,
        });
      }
    } else {
      // Original tag-based parsing for other content
      const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
      let match;

      while ((match = tagRegex.exec(line)) !== null) {
        // Add text before the tag
        if (match.index > currentIndex) {
          parts.push({
            type: "text",
            content: line.substring(currentIndex, match.index),
          });
        }

        // Add the wrapped content
        const tagName = match[1];
        const content = match[2];
        if (tagName) {
          parts.push({
            type: "wrapper",
            tagName: tagName,
            content: content,
            className: wrapperClassNames[tagName] || "",
          } as WrapperPart);
        }

        currentIndex = match.index + match[0].length;
      }

      // Add remaining text after last tag
      if (currentIndex < line.length) {
        parts.push({
          type: "text",
          content: line.substring(currentIndex),
        });
      }

      // If no tags found, treat entire line as text
      if (parts.length === 0) {
        parts.push({
          type: "text",
          content: line,
        });
      }
    }

    return (
      <div
        key={lineIndex}
        className={cn(
          "transition-text transition-background flex items-center justify-start !rounded-l-none delay-200 duration-500",
          TEXT_SIZE_MAP[textSize].lineHeight,
          lineClassName,
          strongLineNumbers.includes(lineIndex + 1) ? "group/strong-line" : "",
          strongLineNumbers.includes(lineIndex + 1) ? strongLineClassName : ""
          // Removed isUnsetEnvVar coloring here since it's now handled per-part
        )}
        data-strong={strongLineNumbers.includes(lineIndex + 1)}
        data-unset={isUnsetEnvVar}
        style={{
          minHeight: TEXT_SIZE_MAP[textSize].minHeight,
          whiteSpace: "pre",
        }}
      >
        {parts.map((part, partIndex) => {
          if (part.type === "wrapper") {
            return (
              <span
                key={partIndex}
                className={part.className}
                style={{ whiteSpace: "pre" }}
              >
                {part.content}
              </span>
            );
          } else {
            return (
              <span key={partIndex} style={{ whiteSpace: "pre" }}>
                {part.content}
              </span>
            );
          }
        })}
      </div>
    );
  });
};

export interface CodeEditorProps {
  code?: string;
  codeClassName?: string;
  wrapperClassNames?: Record<string, string>;
  disableScroll?: boolean;
  textSize?: "sm" | "md";
  topLineNumber?: number;
  leftColumn?: number;
  minLineCount?: number;
  strongLineNumbers?: number[];
  strongLineClassName?: string;
  lineClassName?: string;
  className?: string;
  showCopyButton?: boolean;
}

const TEXT_SIZE_MAP = {
  sm: {
    size: "text-xs",
    lineHeight: "leading-4",
    minHeight: "1.2rem",
    lineHeightPx: 19.2,
    charWidthPx: 7.2, // Approximate character width for monospace font
  },
  md: {
    size: "text-sm",
    lineHeight: "leading-6",
    minHeight: "1.5rem",
    lineHeightPx: 24, // 1.5rem in pixels
    charWidthPx: 8.4, // Approximate character width for monospace font
  },
};

// Component for rendering the code editor UI (visual display)
export function CodeEditor({
  code = "",
  wrapperClassNames = DEFAULT_WRAPPER_CLASSNAMES,
  disableScroll = false,
  textSize = "md",
  topLineNumber = 1,
  leftColumn = 1,
  minLineCount = 2,
  strongLineNumbers = [],
  strongLineClassName,
  lineClassName,
  className,
  showCopyButton = true,
  onVariableClick,
}: CodeEditorProps) {
  const lines = code.split("\n");
  const lineCount = lines.length;
  const scrollYAreaRef = useRef<HTMLDivElement>(null);
  const scrollXAreaRef = useRef<HTMLDivElement>(null);

  const scrollFromTop = useMemo(() => {
    const lineHeight = TEXT_SIZE_MAP[textSize].lineHeightPx;
    return (topLineNumber - 1) * lineHeight;
  }, [topLineNumber, textSize]);

  const scrollFromLeft = useMemo(() => {
    const charWidth = TEXT_SIZE_MAP[textSize].charWidthPx;
    return (leftColumn - 1) * charWidth;
  }, [leftColumn, textSize]);

  // Effect to handle scrolling to the specified top line and left column
  useEffect(() => {
    if (
      !disableScroll &&
      scrollYAreaRef.current &&
      (topLineNumber > 1 || leftColumn > 1)
    ) {
      const scrollContainer = scrollYAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        if (topLineNumber > 1) {
          scrollContainer.scrollTop = scrollFromTop;
        }
        if (leftColumn > 1) {
          scrollContainer.scrollLeft = scrollFromLeft;
        }
      }
    }
  }, [
    disableScroll,
    code,
    scrollFromTop,
    scrollFromLeft,
    topLineNumber,
    leftColumn,
  ]);

  const codeBox = (
    <div
      className={cn(
        "overflow-hidden py-2 pr-2 pl-0 font-mono",
        TEXT_SIZE_MAP[textSize].size
      )}
      style={{
        whiteSpace: "pre",
        wordWrap: "break-word" as const,
        overflowWrap: "normal",
      }}
    >
      {code ? (
        <CodeWithHighlighting
          codeText={code}
          wrapperClassNames={wrapperClassNames}
          strongLineNumbers={strongLineNumbers}
          textSize={textSize}
          topLineNumber={topLineNumber}
          disableScroll={disableScroll}
          strongLineClassName={strongLineClassName}
          lineClassName={lineClassName}
          onVariableClick={onVariableClick}
        />
      ) : (
        <div
          className={cn(TEXT_SIZE_MAP[textSize].lineHeight)}
          style={{ minHeight: TEXT_SIZE_MAP[textSize].minHeight }}
        >
          // Start typing your code here...
        </div>
      )}
    </div>
  );

  const content = (
    <div className="text-muted-foreground flex">
      {/* Line Numbers */}
      <div
        className={cn(
          "text-muted-foreground/40 dark:bg-surface z-10 bg-white py-2 pl-2 text-right select-none",
          TEXT_SIZE_MAP[textSize].size
        )}
      >
        {Array.from({ length: Math.max(lineCount, minLineCount) }, (_, i) => (
          <div
            key={i + 1}
            className={cn(
              "transition-text transition-background flex items-center justify-start !rounded-r-none pr-4 pl-2 font-mono delay-200 duration-500",
              TEXT_SIZE_MAP[textSize].lineHeight,
              lineClassName,
              strongLineNumbers.includes(i + 1) ? "text-primary/70" : "",
              strongLineNumbers.includes(i + 1) ? strongLineClassName : ""
            )}
            style={{ minHeight: TEXT_SIZE_MAP[textSize].minHeight }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code Display Area */}
      <div className="text-muted-foreground relative flex-1">
        {/* Visible syntax highlighted code */}
        {
          <div key={code} className="absolute top-0 left-0 size-full">
            {codeBox}
          </div>
        }
      </div>
    </div>
  );

  const codeWrapperClassNameStyle =
    "rounded-xl border bg-white transition-all dark:bg-surface";

  return (
    <div className={cn("p-1 pt-0", className)}>
      <div className="relative size-full">
        {/* Copy Button - Top Left */}
        {showCopyButton && (
          <div className="absolute top-2 left-2 z-10">
            <CopyButton
              toCopy={code}
              variant="outline"
              size="icon-sm"
              aria-label="Copy code to clipboard"
              className="bg-background/80 border-border/50 hover:bg-background/90 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Copy Button - Top Right */}
        {showCopyButton && (
          <div className="absolute top-2 right-2 z-10">
            <CopyButton
              toCopy={code}
              variant="outline"
              size="icon-sm"
              aria-label="Copy code to clipboard"
              className="bg-background/80 border-border/50 hover:bg-background/90 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Code Content */}
        {content}
      </div>
    </div>
  );
}
