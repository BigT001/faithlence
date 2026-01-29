# 🎊 FAITHLENCE: Production-Grade Media Analysis

## Overview
**Faithlence** is a production-ready transcription and analysis system for audio and video files. It leverages advanced AI (Google Gemini 1.5 Pro) to transform media into deep, meaningful faith-based content—summaries, timestamps, hashtags, and spiritual insights.

## 🎯 Core Features
- **Direct File Upload**: Drag and drop support for major audio and video formats (MP3, WAV, M4A, MP4, MOV, etc).
- **Universal Processing**: Robustly handles any media file by extracting audio tracks.
- **AI-Powered Analysis**: Uses Google Gemini's multimodal capabilities for accurate transcription and deep spiritual analysis.
- **Production Grade**: Includes comprehensive logging, error handling, and type safety.

## 🏗️ The Architecture (Simplified)

```
[User Upload] --> [Next.js API] --> [FFmpeg Audio Extraction] --> [Gemini 1.5 Pro] --> [MongoDB]
```

1.  **Upload**: User uploads a file via the web interface.
2.  **Extraction**: `ffmpeg-static` + `fluent-ffmpeg` extract a clean audio track.
3.  **Analysis**: The audio file is sent to Google Gemini for processing.
4.  **Storage**: Results are saved to MongoDB.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Processing**: `fluent-ffmpeg`, `ffmpeg-static`
- **AI**: Google Generative AI (Gemini)
- **Database**: MongoDB (Mongoose)

## 🚀 How to Use
1.  Start the dev server: `pnpm dev`
2.  Open `http://localhost:3000`
3.  Upload an audio or video file.
4.  View the results immediately.
5.  Check `http://localhost:3000/debug` for real-time processing logs.
