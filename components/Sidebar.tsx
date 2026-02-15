'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileAudio,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryItem {
    id: string;
    title: string;
    summary: string;
    timestamp: string;
    type: string;
}

interface SidebarProps {
    onNewChat?: () => void;
    onSelectHistory?: (id: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ onNewChat, onSelectHistory, isOpen, onClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch history from API
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('/api/history');
                const data = await response.json();
                if (data.success) {
                    setHistoryItems(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Refresh every 30 seconds
        const interval = setInterval(fetchHistory, 30000);
        return () => clearInterval(interval);
    }, []);

    // Group items by time
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgoStart = new Date(todayStart);
    weekAgoStart.setDate(weekAgoStart.getDate() - 7);

    const todayItems = historyItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= todayStart;
    });

    const yesterdayItems = historyItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= yesterdayStart && itemDate < todayStart;
    });

    const weekItems = historyItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= weekAgoStart && itemDate < yesterdayStart;
    });

    const olderItems = historyItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate < weekAgoStart;
    });

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div
                className={cn(
                    "h-screen bg-[#0d0d0d] text-white border-r border-gray-800 transition-all duration-300 flex flex-col z-50",
                    "fixed md:relative inset-y-0 left-0 transform md:transform-none",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    collapsed ? "w-64 md:w-16" : "w-64"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    {(isOpen || !collapsed) && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">Faithlence</h2>
                                <p className="text-xs text-gray-400">Faith and Influence</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:flex text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="px-3 mb-4">
                    <Button
                        onClick={onNewChat}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                        size={collapsed ? "icon" : "default"}
                    >
                        <Plus className="w-4 h-4" />
                        {!collapsed && <span className="ml-2">New Analysis</span>}
                    </Button>
                </div>

                <Separator className="bg-gray-800" />

                {/* History */}
                {!collapsed && (
                    <ScrollArea className="flex-1 px-3 py-4">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-purple-500 rounded-full mx-auto mb-2" />
                                <p>Loading history...</p>
                            </div>
                        ) : historyItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No history yet</p>
                                <p className="text-xs mt-1">Upload a file to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Today */}
                                {todayItems.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 px-3">Today</h3>
                                        <div className="space-y-1">
                                            {todayItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelectHistory?.(item.id)}
                                                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 transition-colors group"
                                                >
                                                    <FileAudio className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 group-hover:text-purple-400" />
                                                    <span className="text-left truncate">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Yesterday */}
                                {yesterdayItems.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 px-3">Yesterday</h3>
                                        <div className="space-y-1">
                                            {yesterdayItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelectHistory?.(item.id)}
                                                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 transition-colors group"
                                                >
                                                    <FileAudio className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 group-hover:text-purple-400" />
                                                    <span className="text-left truncate">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Previous 7 Days */}
                                {weekItems.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 px-3">Previous 7 Days</h3>
                                        <div className="space-y-1">
                                            {weekItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelectHistory?.(item.id)}
                                                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 transition-colors group"
                                                >
                                                    <FileAudio className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 group-hover:text-purple-400" />
                                                    <span className="text-left truncate">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Older */}
                                {olderItems.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 px-3">Older</h3>
                                        <div className="space-y-1">
                                            {olderItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelectHistory?.(item.id)}
                                                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 transition-colors group"
                                                >
                                                    <FileAudio className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 group-hover:text-purple-400" />
                                                    <span className="text-left truncate">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                )}

                {/* Footer */}
                <div className="p-3 border-t border-gray-800">
                    {!collapsed && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                                U
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-gray-400 truncate">user@faithlence.com</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
