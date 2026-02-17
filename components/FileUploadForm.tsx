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

type UploadStage = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'done' | 'error';

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: '',
  uploading: 'Uploading file...',
  processing: 'Transcribing your media with AI...',
  analyzing: 'Deep analysis in progress — finding insights...',
  done: 'Complete!',
  error: 'Something went wrong',
};

export function FileUploadForm() {
  const [stage, setStage] = useState<UploadStage>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = stage !== 'idle' && stage !== 'done' && stage !== 'error';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    // Validate file size (20MB limit for direct Gemini inline data)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        `Maximum supported size is 20MB. Please use a shorter audio clip or compress your file.`
      );
      return;
    }

    try {
      setStage('uploading');
      logger.info('FileUpload', 'Starting upload', { name: file.name, size: file.size, type: file.type });

      // Always try direct upload first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      let response: Response;
      let data: UploadResult;

      try {
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        data = await response.json();
      } catch (fetchError: any) {
        // If the direct upload fails with a network error, it might be too large for Vercel
        // Try Blob upload as fallback
        logger.warn('FileUpload', 'Direct upload failed, trying Blob fallback', { error: fetchError.message });

        data = await uploadViaBlob(file);
        setStage('done');
        setResult(data);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // If we got a 413 (Payload Too Large), try Blob upload
      if (response.status === 413) {
        logger.warn('FileUpload', 'File too large for direct upload, trying Blob', { size: file.size });
        data = await uploadViaBlob(file);
        setStage('done');
        setResult(data);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (!response.ok) {
        throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
      }

      setStage('done');
      setResult(data);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      logger.error('FileUpload', 'Upload failed', { error: message });
      setError(message);
      setStage('error');
    }
  };

  /**
   * Blob upload fallback for large files
   */
  async function uploadViaBlob(file: File): Promise<UploadResult> {
    try {
      const { upload } = await import('@vercel/blob/client');

      setStage('uploading');

      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
      });

      setStage('processing');

      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          title: file.name,
        }),
      });

      const data = await processResponse.json();
      if (!processResponse.ok) {
        throw new Error(data.error?.message || `Processing failed with status ${processResponse.status}`);
      }
      return data;
    } catch (blobError: any) {
      // If blob also fails, give a clear message
      throw new Error(
        `File upload failed. Your file may be too large for the current hosting plan. ` +
        `Please try a smaller file (under 4MB), or contact the admin to configure large file storage. ` +
        `(${blobError.message})`
      );
    }
  }

  const resetForm = () => {
    setStage('idle');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const progress = stage === 'uploading' ? 20 : stage === 'processing' ? 50 : stage === 'analyzing' ? 80 : stage === 'done' ? 100 : 0;

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
            {isLoading ? STAGE_LABELS[stage] : 'Drop audio/video/image file here or click to select'}
          </div>
          <div className="text-sm text-gray-500">
            Supported: Audio, Video, Images (Max 20MB)
          </div>
        </label>
      </div>

      {/* Progress Bar & Status */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>{STAGE_LABELS[stage]}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${stage === 'uploading' ? 'bg-blue-500' :
                  stage === 'processing' ? 'bg-purple-500' :
                    'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center animate-pulse">
            {stage === 'uploading' && 'Uploading your file...'}
            {stage === 'processing' && 'Our AI is listening to every word. This may take a moment for longer files...'}
            {stage === 'analyzing' && 'Uncovering deep insights, scriptures, and faith-based content...'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button
            onClick={resetForm}
            className="ml-4 text-sm underline hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {result?.success && result.data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
              <span className="text-2xl">✨</span> Analysis Complete!
            </h3>
            {!result.data.id && (
              <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                <span>⚠️</span>
                <span><strong>Note:</strong> This analysis couldn&apos;t be saved to your history due to a temporary database connection issue.</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-1">File Name</h4>
            <p className="text-gray-700">{result.data.fileName}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Transcription</h4>
            <p className="text-gray-700 line-clamp-3">{result.data.analysis.transcription}</p>
          </div>

          {result.data.analysis.summary && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Summary</h4>
              <p className="text-gray-700">{result.data.analysis.summary}</p>
            </div>
          )}

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

          {result.data.analysis.deepAnalysis && (
            <div className="border-t-2 border-gray-300 pt-4 mt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Deep Analysis</h3>

              {result.data.analysis.deepAnalysis.overallMessage && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                  <h4 className="font-semibold text-purple-900 mb-2">💡 Core Message</h4>
                  <p className="text-purple-800">{result.data.analysis.deepAnalysis.overallMessage}</p>
                </div>
              )}

              {result.data.analysis.deepAnalysis.keyQuotes && result.data.analysis.deepAnalysis.keyQuotes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">📝 Key Quotes (Word-by-Word Analysis)</h4>
                  <div className="space-y-4">
                    {result.data.analysis.deepAnalysis.keyQuotes.map((quote: any, i: number) => (
                      <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <blockquote className="text-blue-900 font-medium italic mb-2 border-l-4 border-blue-500 pl-3">
                          &ldquo;{quote.quote}&rdquo;
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

          <button
            onClick={() => {
              resetForm();
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
