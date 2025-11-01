'use client';

import React from 'react';

interface AnalysisParserProps {
  content: string;
}

export function AnalysisParser({ content }: AnalysisParserProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const title = trimmedLine.substring(2, trimmedLine.length - 2);
          return (
            <h5 key={index} className="font-bold text-foreground text-base pt-3 pb-1">
              {title}
            </h5>
          );
        }

        if (trimmedLine.startsWith('- ')) {
           return <p key={index} className="my-1">{line}</p>;
        }

        if (trimmedLine === '') {
          return <br key={index} />;
        }

        return <p key={index} className="my-2">{line}</p>;
      })}
    </div>
  );
}
