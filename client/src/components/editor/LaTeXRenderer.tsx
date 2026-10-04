'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders HTML content with LaTeX math support.
 * Supports inline math: $...$ and display math: $$...$$
 */
export function LaTeXRenderer({ html, className = '' }: { html: string; className?: string }) {
  const processedHtml = useMemo(() => {
    if (!html) return '';

    // Process display math first ($$...$$)
    let result = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    // Process inline math ($...$)
    result = result.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    return result;
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

/**
 * Renders plain text with LaTeX support (no HTML tags)
 */
export function LaTeXTextRenderer({ text, className = '' }: { text: string; className?: string }) {
  const processedHtml = useMemo(() => {
    if (!text) return '';

    // Escape HTML first, then process LaTeX
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Process display math first ($$...$$)
    let result = escaped.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    // Process inline math ($...$)
    result = result.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    // Convert newlines to <br>
    result = result.replace(/\n/g, '<br>');

    return result;
  }, [text]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

/**
 * Extract plain text from HTML (for search/preview)
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}