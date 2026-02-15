'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Send, Sparkles, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    onFileUpload?: (file: File) => void;
    selectedContentId?: string | null;
    initialData?: any;
    onClearContent?: () => void;
    isUploading?: boolean;
    onToggleMenu?: () => void;
}

export function ChatInterface({ onFileUpload, selectedContentId, initialData, onClearContent, isUploading, onToggleMenu }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const [selectedContent, setSelectedContent] = useState<any>(null);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load initial data if provided (e.g. from a fresh upload that failed to save to DB)
    useEffect(() => {
        if (initialData) {
            setSelectedContent(initialData);
            setMessages([]);
        }
    }, [initialData]);

    // Fetch content when selectedContentId changes
    useEffect(() => {
        if (selectedContentId) {
            fetchContent(selectedContentId);
            setMessages([]); // Reset chat when switching content
        } else if (!initialData) {
            setSelectedContent(null);
            setMessages([]);
        }
    }, [selectedContentId, initialData]);

    const fetchContent = async (id: string) => {
        setLoading(true);
        setSelectedContent(null); // Clear old content
        try {
            const response = await fetch(`/api/content/${id}`);
            const data = await response.json();
            if (data.success) {
                setSelectedContent(data.data);
            } else {
                console.error('API Error:', data.error);
                alert('Failed to load content details.');
            }
        } catch (error) {
            console.error('Failed to fetch content:', error);
            alert('An error occurred while loading content.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Call the upload handler
        if (onFileUpload) {
            onFileUpload(file);
        }

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedContent || isGenerating) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsGenerating(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: selectedContentId,
                    message: userMessage,
                    history: messages
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.data.response }]);
            } else {
                console.error('Chat Error:', data.error);
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server. Please check your connection." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClear = () => {
        setSelectedContent(null);
        if (onClearContent) {
            onClearContent();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#0d0d0d]">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleMenu}
                        className="text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white">Faithlence</span>
                    </div>
                </div>
                {selectedContent && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-gray-500 hover:text-white h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {(loading || isUploading) ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full mx-auto mb-4" />
                            <p className="text-gray-400">
                                {isUploading ? 'Analyzing with Gemini AI...' : 'Loading content...'}
                            </p>
                        </div>
                    </div>
                ) : selectedContent ? (
                    <div className="flex flex-col min-h-full">
                        <ResultsDisplay data={selectedContent} />

                        {/* Messages Area */}
                        {messages.length > 0 && (
                            <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
                                <div className="flex items-center gap-2 border-b border-gray-800 pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-purple-400">💬</span> Discussion
                                    </h2>
                                </div>
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col gap-3 p-4 md:p-5 rounded-2xl max-w-[95%] md:max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-sm",
                                            msg.role === 'user'
                                                ? "ml-auto bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 text-purple-50"
                                                : "bg-[#161616] border border-white/5 text-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {msg.role === 'user' ? (
                                                <div className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-500/20 flex items-center justify-center text-[8px] font-bold">YOU</div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center"><Sparkles className="w-2.5 h-2.5 text-blue-400" /></div>
                                            )}
                                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-40">
                                                {msg.role === 'user' ? 'Direct Question' : 'Faithlence Insights'}
                                            </span>
                                        </div>
                                        <div className="text-[14px] md:text-base leading-relaxed prose prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                                                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                                    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isGenerating && (
                                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl max-w-[85%] animate-pulse">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center animate-spin">
                                                <Sparkles className="w-3 h-3 text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Faithlence AI is thinking...</span>
                                        </div>
                                        <div className="h-4 bg-gray-700 rounded-md w-[20%]" />
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="max-w-3xl w-full">
                            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500 mb-6 tracking-tight">
                                How can I help you analyze your content?
                            </h2>

                            {/* Suggestions */}
                            <div className="flex flex-wrap justify-center gap-3 mt-12 mb-8">
                                <button
                                    onClick={() => setInput("Can you summarize the main theological themes?")}
                                    className="px-4 py-2 rounded-full border border-gray-800 bg-gray-900/40 text-gray-400 text-sm hover:border-purple-500/50 hover:text-white transition-all"
                                >
                                    Theological themes
                                </button>
                                <button
                                    onClick={() => setInput("What are the most inspiring quotes from this?")}
                                    className="px-4 py-2 rounded-full border border-gray-800 bg-gray-900/40 text-gray-400 text-sm hover:border-blue-500/50 hover:text-white transition-all"
                                >
                                    Impactful quotes
                                </button>
                                <button
                                    onClick={() => setInput("Give me social media captions for this content.")}
                                    className="px-4 py-2 rounded-full border border-gray-800 bg-gray-900/40 text-gray-400 text-sm hover:border-green-500/50 hover:text-white transition-all"
                                >
                                    Social media hooks
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/90 to-transparent">
                <div className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-3 bg-[#111111] backdrop-blur-2xl border border-white/5 rounded-2xl p-3 focus-within:border-purple-500/30 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all duration-500 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.aac,.mov,.avi,.3gp"
                            className="hidden"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 w-10 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl flex-shrink-0 transition-all"
                        >
                            <Upload className="w-5 h-5" />
                        </Button>

                        <div className="flex-1 relative pb-1">
                            <Sparkles className="absolute left-2 top-2.5 w-4 h-4 text-purple-500/50 pointer-events-none" />
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={selectedContent ? "Ask anything about this analysis..." : "Upload a file or ask a question..."}
                                className="w-full bg-transparent text-white placeholder-gray-600 pl-8 pr-2 py-2 resize-none focus:outline-none min-h-[40px] max-h-[200px] text-sm md:text-base selection:bg-purple-500/30"
                                rows={1}
                                style={{
                                    height: input ? 'auto' : '40px'
                                }}
                                ref={(el) => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        if (input) el.style.height = `${el.scrollHeight}px`;
                                    }
                                }}
                            />
                        </div>

                        <Button
                            disabled={!input.trim() || isGenerating}
                            onClick={handleSendMessage}
                            className={cn(
                                "h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-500",
                                input.trim()
                                    ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 scale-100 opacity-100"
                                    : "bg-gray-800/50 text-gray-600 scale-95 opacity-50"
                            )}
                            size="icon"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 text-center mt-3 font-medium tracking-wide">
                        Faithlence AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
