'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import AppInitializer from '@/components/AppInitializer';

export default function Home() {
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [tempAnalysis, setTempAnalysis] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNewChat = () => {
    setSelectedContentId(null);
    setTempAnalysis(null);
    setIsMobileMenuOpen(false);
  };

  const handleSelectHistory = (id: string) => {
    setTempAnalysis(null);
    setSelectedContentId(id);
    setIsMobileMenuOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file.name);
    setIsUploading(true);

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (data.data?.id) {
          console.log('Upload successful:', data);
          setSelectedContentId(data.data.id);
        } else if (data.data?.analysis) {
          console.warn('Upload successful but no ID returned. Displaying temporary results.');
          setTempAnalysis(data.data.analysis);
          alert('Analysis complete, but failed to save to history. You can view it now, but it won\'t be available next time.');
        }
      } else {
        console.error('Upload failed details:', data);
        const errorMsg = data.error?.message || 'Upload failed. Please check the console for details.';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearContent = () => {
    setSelectedContentId(null);
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
