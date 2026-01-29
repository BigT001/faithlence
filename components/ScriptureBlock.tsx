'use client';

import { Scripture } from '@/types/content';

interface ScriptureBlockProps {
  scripture: Scripture;
}

export default function ScriptureBlock({ scripture }: ScriptureBlockProps) {
  const reference = `${scripture.book} ${scripture.chapter}:${scripture.verse}`;

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-amber-900">{reference}</h4>
      </div>
      <p className="text-amber-900 leading-relaxed text-sm italic">"{scripture.text}"</p>
    </div>
  );
}
