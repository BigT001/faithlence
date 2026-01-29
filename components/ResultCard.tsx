'use client';

import { AnalysisResult } from '@/types/content';
import ScriptureBlock from './ScriptureBlock';

interface ResultCardProps {
  result: AnalysisResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
        <p className="text-gray-700 leading-relaxed">{result.summary}</p>
      </div>

      {/* Social Media Captions */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Captions</h3>
        <div className="space-y-3">
          {result.captions.map((caption, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-sm text-gray-700">{caption}</p>
              <p className="text-xs text-gray-500 mt-2">{caption.length} characters</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {result.hashtags.map((tag, idx) => (
            <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Faith Story */}
      <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Faith-Based Story</h3>
        <p className="text-gray-700 leading-relaxed italic">{result.story}</p>
      </div>

      {/* Scriptures */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Relevant Scriptures</h3>
        <div className="space-y-4">
          {result.scriptures.map((scripture, idx) => (
            <ScriptureBlock key={idx} scripture={scripture} />
          ))}
        </div>
      </div>
    </div>
  );
}
