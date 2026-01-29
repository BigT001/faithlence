# Faithlence - Technical Requirements & Limitations

## 📋 Current MVP Capabilities

### ✅ What Works Now
- **YouTube URLs Supported:**
  - Standard: `https://youtube.com/watch?v=VIDEO_ID`
  - Shortened: `https://youtu.be/VIDEO_ID`
  - Embedded: `https://youtube.com/embed/VIDEO_ID`
  - **YouTube Shorts**: `https://youtube.com/shorts/VIDEO_ID` ✨ (newly added)

- **Transcription Method:** YouTube Transcript API (requires captions)
- **AI Analysis:** Google Gemini 1.5 Flash
- **Outputs:** Summary, captions, hashtags, faith stories, relevant scriptures

---

## ⚠️ Current Limitations

### 1. **Captions Required**
The current implementation uses YouTube's built-in transcript API, which **requires videos to have captions enabled**.

**Why?**
- YouTube Transcript API only works on videos with:
  - Human-created captions
  - Auto-generated captions (CC available)

**Videos That Won't Work:**
- Videos without captions enabled
- Short clips without transcript support
- Some international content

---

## 🚀 Future Improvements (Phase 2)

### Option 1: Google Gemini Video Analysis
**Capability:** Analyze videos directly without needing captions
**How:** Use Google Generative AI's video processing (supports MP4, WebM, etc.)
**Effort:** Medium
**Benefit:** Support ANY YouTube video, not just caption-enabled ones

```typescript
// Future implementation example
const file = await uploadVideoFromYouTube(youtubeUrl);
const result = await model.generateContent([
  {
    inlineData: {
      mimeType: "video/mp4",
      data: file
    }
  },
  "Analyze this video and provide..."
]);
```

### Option 2: Whisper API Audio Transcription
**Capability:** Download video audio, transcribe using OpenAI Whisper
**How:** youtube-dl or yt-dlp + Whisper API
**Effort:** Medium
**Benefit:** 99% accuracy on any video with audio

### Option 3: Hybrid Approach (Recommended)
1. Try YouTube Transcript API (fast, free)
2. If no captions → Fall back to Whisper/Video API
3. Always get results ✅

---

## 📊 Comparison: Transcription Methods

| Method | Works Without Captions | Cost | Speed | Accuracy |
|--------|----------------------|------|-------|----------|
| YouTube Transcript | ❌ No | FREE | Fast | High |
| Whisper API | ✅ Yes | ~$0.02/min | Medium | Very High |
| Gemini Video | ✅ Yes | FREE* | Slow | Medium |
| Hybrid (Recommended) | ✅ Yes | FREE→$0.02 | Adaptive | High |

\* Limited free tier quota

---

## 🔧 Testing with Current MVP

### Videos That Will Work ✅
- Most TED talks (always have captions)
- News channels (typically have captions)
- Educational content (usually auto-captioned)
- Christian teaching channels (often have captions)
- Popular music videos (usually have captions)

### Find Tested Videos:
Look for the **CC** (closed captions) icon on YouTube player

---

## 📝 Implementation Priority

**Phase 1 (Current - MVP):** ✅ COMPLETE
- YouTube Shorts support
- Caption-based transcription
- Gemini AI analysis
- Faith-based content generation

**Phase 2 (Recommended):** 
- [ ] Add Whisper API fallback
- [ ] Better error messages for no-caption videos
- [ ] Caching for repeated videos
- [ ] Rate limiting for production

**Phase 3 (Advanced):**
- [ ] Direct video file uploads
- [ ] Batch processing
- [ ] Custom AI models
- [ ] Advanced analytics

---

## 🎯 Next Steps

1. **Test with caption-enabled videos first** (current requirement)
2. **Plan Phase 2** when ready to support all videos
3. **Monitor Gemini API costs** before implementing video analysis
4. **Consider Whisper API** if speech accuracy is critical

---

## 📧 Questions?

- **Why captions required?** YouTube Transcript API limitation
- **Will it support no-caption videos?** Yes in Phase 2
- **What about Shorts?** Now supported! ✨
- **How to make it work for all videos?** Implement Whisper or Gemini video analysis

