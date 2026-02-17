'use client';

import React, { useState, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UploadResult {
  success: boolean;
  data?: {
    id?: string | null;
    fileName: string;
    analysis: {
      transcription?: string;
      summary: string;
      caption: string;
      captions: string[];
      hashtags: string[];
      faithStories: any[];
      scriptures: any[];
      story: string;
      deepAnalysis?: {
        keyQuotes: Array<{
          quote: string;
          timestamp?: string;
          analysis: string;
          theologicalInsight: string;
          positivity: string;
        }>;
        theologicalViews: Array<{
          theme: string;
          biblicalPerspective: string;
          practicalApplication: string;
          relatedScriptures: any[];
        }>;
        positivityInsights: string[];
        overallMessage: string;
      };
      socialMediaHooks?: Array<{
        type: string;
        text: string;
        platform: string;
      }>;
    };
  };
  error?: {
    message: string;
  };
}

export function FileUploadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Validate file size (500MB limit)
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size exceeds 500MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Validate file type
      const supportedTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/x-aac', 'audio/ogg', 'audio/webm',
        'audio/flac', 'audio/x-m4a', 'audio/mp4', 'audio/amr', 'audio/3gpp', 'audio/3gpp2', 'audio/x-aiff',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/3gpp',
      ];

      // Relaxed validation: if file.type is empty (common for some rare types), we rely on server validation
      if (file.type && !supportedTypes.includes(file.type)) {
        logger.warn('FileUpload', `File type ${file.type} might be unsupported, but allowing for server-side check`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      // Track upload progress
      setUploadProgress(10);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(50);

      const data: UploadResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
      }

      setUploadProgress(100);
      setResult(data);

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Input */}
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isLoading}
          accept="audio/*,video/*,image/*,.mp3,.mp4,.wav,.m4a,.aac,.mov,.avi,.3gp,.jpg,.jpeg,.png,.webp,.heic"
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className={isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}>
          <div className="text-lg font-semibold text-gray-700 mb-2">
            {isLoading ? 'Processing...' : 'Drop audio/video/image file here or click to select'}
          </div>
          <div className="text-sm text-gray-500">
            Supported: Audio, Video, Images (Max 500MB)
          </div>
        </label>
      </div>

      {/* Progress Bar & Status */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>{uploadProgress < 50 ? 'Uploading file...' : uploadProgress < 90 ? 'Compressing & Extracting Audio...' : 'AI Analysis in progress...'}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${uploadProgress < 50 ? 'bg-blue-500' : uploadProgress < 90 ? 'bg-purple-500' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center animate-pulse">
            {uploadProgress >= 90 ? 'Our AI is deep-diving into your content. This might take a moment...' : 'Processing your media for the best results...'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result?.success && result.data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          {/* Success Header & History Warning */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
              <span className="text-2xl">✨</span> Analysis Complete!
            </h3>
            {!result.data.id && (
              <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                <span>⚠️</span>
                <span><strong>Note:</strong> This analysis couldn't be saved to your history due to a temporary database connection issue.</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">File Name</h4>
            <p className="text-gray-700">{result.data.fileName}</p>
          </div>

          {/* Transcription */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Transcription</h4>
            <p className="text-gray-700 line-clamp-3">{result.data.analysis.transcription}</p>
          </div>

          {/* Summary */}
          {result.data.analysis.summary && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Summary</h4>
              <p className="text-gray-700">{result.data.analysis.summary}</p>
            </div>
          )}

          {/* Captions */}
          {result.data.analysis.captions && result.data.analysis.captions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Captions</h4>
              <ul className="space-y-1">
                {result.data.analysis.captions.map((caption: string, i: number) => (
                  <li key={i} className="text-gray-700 text-sm">• {caption}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hashtags */}
          {result.data.analysis.hashtags && result.data.analysis.hashtags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {result.data.analysis.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Faith Stories */}
          {result.data.analysis.faithStories && result.data.analysis.faithStories.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Faith Stories</h4>
              <ul className="space-y-2">
                {result.data.analysis.faithStories.map((story: any, i: number) => (
                  <li key={i} className="text-gray-700 text-sm">
                    • {typeof story === 'string' ? story : story.title || JSON.stringify(story)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scriptures */}
          {result.data.analysis.scriptures && result.data.analysis.scriptures.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Scriptures</h4>
              <ul className="space-y-2">
                {result.data.analysis.scriptures.map((scripture: any, i: number) => (
                  <li key={i} className="text-gray-700 text-sm">
                    • {typeof scripture === 'string' ? scripture : scripture.reference || JSON.stringify(scripture)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deep Analysis Section */}
          {result.data.analysis.deepAnalysis && (
            <div className="border-t-2 border-gray-300 pt-4 mt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Deep Analysis</h3>

              {/* Overall Message */}
              {result.data.analysis.deepAnalysis.overallMessage && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                  <h4 className="font-semibold text-purple-900 mb-2">💡 Core Message</h4>
                  <p className="text-purple-800">{result.data.analysis.deepAnalysis.overallMessage}</p>
                </div>
              )}

              {/* Key Quotes Analysis */}
              {result.data.analysis.deepAnalysis.keyQuotes && result.data.analysis.deepAnalysis.keyQuotes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">📝 Key Quotes (Word-by-Word Analysis)</h4>
                  <div className="space-y-4">
                    {result.data.analysis.deepAnalysis.keyQuotes.map((quote: any, i: number) => (
                      <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <blockquote className="text-blue-900 font-medium italic mb-2 border-l-4 border-blue-500 pl-3">
                          "{quote.quote}"
                        </blockquote>
                        {quote.timestamp && (
                          <p className="text-xs text-blue-600 mb-2">⏱️ {quote.timestamp}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Analysis:</span>
                            <p className="text-gray-600 mt-1">{quote.analysis}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Theological Insight:</span>
                            <p className="text-gray-600 mt-1">{quote.theologicalInsight}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-green-700">✨ Positivity:</span>
                            <p className="text-green-600 mt-1">{quote.positivity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Theological Views */}
              {result.data.analysis.deepAnalysis.theologicalViews && result.data.analysis.deepAnalysis.theologicalViews.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">📖 Theological Perspectives</h4>
                  <div className="space-y-4">
                    {result.data.analysis.deepAnalysis.theologicalViews.map((view: any, i: number) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h5 className="font-bold text-amber-900 mb-2">{view.theme}</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Biblical Perspective:</span>
                            <p className="text-gray-600 mt-1">{view.biblicalPerspective}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Practical Application:</span>
                            <p className="text-gray-600 mt-1">{view.practicalApplication}</p>
                          </div>
                          {view.relatedScriptures && view.relatedScriptures.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700">Related Scriptures:</span>
                              <ul className="mt-1 space-y-1">
                                {view.relatedScriptures.map((scripture: any, j: number) => (
                                  <li key={j} className="text-gray-600 text-xs">
                                    • {scripture.book} {scripture.chapter}:{scripture.verse} - {scripture.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Positivity Insights */}
              {result.data.analysis.deepAnalysis.positivityInsights && result.data.analysis.deepAnalysis.positivityInsights.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">✨ Positivity & Uplifting Insights</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {result.data.analysis.deepAnalysis.positivityInsights.map((insight: string, i: number) => (
                        <li key={i} className="text-green-700 flex items-start">
                          <span className="mr-2">🌟</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Social Media Hooks */}
          {result.data.analysis.socialMediaHooks && result.data.analysis.socialMediaHooks.length > 0 && (
            <div className="border-t-2 border-gray-300 pt-4 mt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Social Media Hooks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.data.analysis.socialMediaHooks.map((hook: any, i: number) => (
                  <div key={i} className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-700 uppercase">{hook.platform}</span>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">{hook.type}</span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium">{hook.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Another */}
          <button
            onClick={() => {
              setResult(null);
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
