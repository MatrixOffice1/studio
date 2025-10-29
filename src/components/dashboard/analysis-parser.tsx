'use client';

import React from 'react';

interface AnalysisParserProps {
  content: string;
}

export function AnalysisParser({ content }: AnalysisParserProps) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      {lines.map((line, index) => {
        // Trim the line to handle potential leading/trailing whitespace
        const trimmedLine = line.trim();

        // Check if the line is a title (e.g., **TITLE**)
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const title = trimmedLine.substring(2, trimmedLine.length - 2);
          return (
            <h5 key={index} className="font-bold text-foreground text-base pt-3 pb-1">
              {title}
            </h5>
          );
        }

        // Check if the line is empty, which we use for spacing
        if (trimmedLine === '') {
          return <div key={index} className="h-2" />; // Creates a small vertical gap
        }

        // Render a regular text line
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}
