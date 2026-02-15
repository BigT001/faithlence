'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import AppInitializer from '@/components/AppInitializer';

export default function Home() {
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [tempAnalysis, setTempAnalysis] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNewChat = () => {
    setSelectedContentId(null);
    setTempAnalysis(null);
    setUploadProgress(0);
    setUploadStatus('');
    setIsMobileMenuOpen(false);
  };

  const handleSelectHistory = (id: string) => {
    setTempAnalysis(null);
    setUploadProgress(0);
    setUploadStatus('');
    setSelectedContentId(id);
    setIsMobileMenuOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size (500MB limit)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 500MB.`);
      return;
    }

    console.log('Starting upload:', file.name, file.size, file.type);
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus('Preparing file...');

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      setUploadStatus('Uploading to server...');
      setUploadProgress(15);

      // Track pseudo-progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 40) return prev + 2;
          if (prev < 85) return prev + 0.5;
          return prev;
        });
      }, 1000);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(90);
      setUploadStatus('AI Analysis finishing...');

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);
        setUploadStatus('Complete!');

        if (data.data?.id) {
          console.log('Upload successful:', data.data.id);
          setSelectedContentId(data.data.id);
        } else if (data.data?.analysis) {
          setTempAnalysis(data.data.analysis);
          alert('Analysis complete, but failed to save to history. You can view it now, but it won\'t be available next time. (Database Connection Issue)');
        }
      } else {
        const errorMsg = data.error?.message || 'Upload failed. Please try a smaller file or a different format.';
        alert(`Upload Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Upload catch error:', error);
      alert('Network error or connection lost. If you are on an iPhone, ensure you stay on the page until upload finishes.');
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    }
  };

  const handleClearContent = () => {
    setSelectedContentId(null);
    setTempAnalysis(null);
  };

  return (
    <>
      <AppInitializer />
      <div className="flex h-screen overflow-hidden bg-[#0d0d0d] relative">
        <Sidebar
          onNewChat={handleNewChat}
          onSelectHistory={handleSelectHistory}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <ChatInterface
          onFileUpload={handleFileUpload}
          selectedContentId={selectedContentId}
          initialData={tempAnalysis}
          onClearContent={handleClearContent}
          isUploading={isUploading}
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>
    </>
  );
}
