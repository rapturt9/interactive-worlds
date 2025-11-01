'use client';

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  showDebug: boolean;
  isSystemMessage: boolean;
  customComponents?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

/**
 * Optimized text display component
 * Shows raw text during streaming (fast), markdown when complete (beautiful)
 */
function StreamingText({
  text,
  isStreaming,
  showDebug,
  isSystemMessage,
  customComponents,
}: StreamingTextProps) {
  // Memoize markdown components to prevent recreation
  const markdownComponents = useMemo(
    () => customComponents || {},
    [customComponents]
  );

  // During streaming: show raw text with basic formatting (fast!)
  if (isStreaming) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-parchment-primary animate-pulse">
          {text}
          <span className="inline-block w-2 h-4 ml-1 bg-accent-parchment animate-blink" />
        </div>
      </div>
    );
  }

  // After streaming complete: render beautiful markdown
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Export memoized component - only re-render when text/isStreaming changes
export default memo(StreamingText, (prev, next) => {
  // Custom comparison: only re-render if text content or streaming state changes
  return (
    prev.text === next.text &&
    prev.isStreaming === next.isStreaming &&
    prev.showDebug === next.showDebug &&
    prev.isSystemMessage === next.isSystemMessage
  );
});
