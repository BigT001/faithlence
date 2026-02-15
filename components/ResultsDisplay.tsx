'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultsDisplayProps {
    data: any;
}

export function ResultsDisplay({ data }: ResultsDisplayProps) {
    if (!data) return null;

    return (
        <div className="w-full">
            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-xl p-4 md:p-6">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {data.videoTitle || 'Analysis Results'}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {new Date(data.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Summary */}
                {data.summary && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-blue-400">📝</span> Summary
                        </h2>
                        <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                    </div>
                )}

                {/* Transcription */}
                {data.transcription && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-indigo-400">📄</span> Transcription
                        </h2>
                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-gray-400 text-sm italic leading-relaxed whitespace-pre-wrap">
                                {data.transcription}
                            </p>
                        </div>
                    </div>
                )}

                {/* Captions */}
                {data.captions && data.captions.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-green-400">💬</span> Captions
                        </h2>
                        <ul className="space-y-2">
                            {data.captions.map((caption: string, i: number) => (
                                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-green-400 mt-1">•</span>
                                    <span>{caption}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Hashtags */}
                {data.hashtags && data.hashtags.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-purple-400">#</span> Hashtags
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {data.hashtags.map((tag: string, i: number) => (
                                <span
                                    key={i}
                                    className="bg-purple-900/30 border border-purple-700/50 text-purple-300 px-3 py-1 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transformational Testimony */}
                {data.story && (
                    <div className="bg-gradient-to-br from-orange-900/30 via-amber-900/20 to-yellow-900/20 border border-orange-500/30 rounded-2xl p-6 md:p-8 shadow-lg shadow-orange-500/5">
                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                            <span className="text-orange-400 bg-orange-400/10 p-2 rounded-lg">🕯️</span>
                            Transformational Testimony
                        </h2>
                        <div className="relative">
                            <span className="absolute -left-4 -top-2 text-6xl text-orange-500/10 italic serif">"</span>
                            <p className="text-gray-200 leading-relaxed text-lg italic pl-4 border-l-2 border-orange-500/20 font-medium">
                                {data.story}
                            </p>
                        </div>
                    </div>
                )}

                {/* Scriptures */}
                {data.scriptures && data.scriptures.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-blue-400">📖</span> Relevant Scriptures
                        </h2>
                        <div className="space-y-4">
                            {data.scriptures.map((scripture: any, i: number) => (
                                <div key={i} className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                                    <p className="text-blue-300 font-semibold text-sm mb-2">
                                        {scripture.book} {scripture.chapter}:{scripture.verse}
                                    </p>
                                    <p className="text-gray-300 italic">"{scripture.text}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Deep Analysis */}
                {data.deepAnalysis && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/30 rounded-xl p-4 md:p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-purple-400">🔍</span> Deep Analysis
                            </h2>

                            {/* Overall Message */}
                            {data.deepAnalysis.overallMessage && (
                                <div className="bg-purple-900/20 border-l-4 border-purple-500 p-4 mb-4 rounded">
                                    <h3 className="font-semibold text-purple-300 mb-2">💡 Core Message</h3>
                                    <p className="text-gray-300">{data.deepAnalysis.overallMessage}</p>
                                </div>
                            )}

                            {/* Key Quotes */}
                            {data.deepAnalysis.keyQuotes && data.deepAnalysis.keyQuotes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-white mb-3">📝 Key Quotes Analysis</h3>
                                    <div className="space-y-4">
                                        {data.deepAnalysis.keyQuotes.map((quote: any, i: number) => (
                                            <div key={i} className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                                                <blockquote className="text-blue-300 font-medium italic mb-3 border-l-4 border-blue-500 pl-3">
                                                    "{quote.quote}"
                                                </blockquote>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-semibold text-gray-400">Analysis:</span>
                                                        <p className="text-gray-300 mt-1">{quote.analysis}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-400">Theological Insight:</span>
                                                        <p className="text-gray-300 mt-1">{quote.theologicalInsight}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-green-400">✨ Positivity:</span>
                                                        <p className="text-green-300 mt-1">{quote.positivity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Theological Views */}
                            {data.deepAnalysis.theologicalViews && data.deepAnalysis.theologicalViews.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-white mb-3">📖 Theological Perspectives</h3>
                                    <div className="space-y-4">
                                        {data.deepAnalysis.theologicalViews.map((view: any, i: number) => (
                                            <div key={i} className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4">
                                                <h4 className="font-bold text-amber-300 mb-2">{view.theme}</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-semibold text-gray-400">Biblical Perspective:</span>
                                                        <p className="text-gray-300 mt-1">{view.biblicalPerspective}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-400">Practical Application:</span>
                                                        <p className="text-gray-300 mt-1">{view.practicalApplication}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Positivity Insights */}
                            {data.deepAnalysis.positivityInsights && data.deepAnalysis.positivityInsights.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-white mb-3">✨ Positivity Insights</h3>
                                    <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {data.deepAnalysis.positivityInsights.map((insight: string, i: number) => (
                                                <li key={i} className="text-green-300 flex items-start gap-2">
                                                    <span className="text-green-400 mt-1">🌟</span>
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Social Media Hooks */}
                {data.socialMediaHooks && data.socialMediaHooks.length > 0 && (
                    <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-700/30 rounded-xl p-4 md:p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-pink-400">🚀</span> Social Media Hooks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.socialMediaHooks.map((hook: any, i: number) => (
                                <div key={i} className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-800/30 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-purple-300 uppercase">{hook.platform}</span>
                                        <span className="text-xs bg-purple-800/50 text-purple-200 px-2 py-1 rounded-full">
                                            {hook.type}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm">{hook.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
