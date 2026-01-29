import mongoose from 'mongoose';
import { GeneratedContent } from '@/types/content';

const scriptureSchema = new mongoose.Schema({
  book: String,
  chapter: mongoose.Schema.Types.Mixed,
  verse: mongoose.Schema.Types.Mixed,
  text: String,
}, { _id: false });

const generatedContentSchema = new mongoose.Schema<GeneratedContent>(
  {
    sourceType: {
      type: String,
      default: 'upload'
    },
    sourceUrl: String,
    videoTitle: String,
    fileName: String,
    transcription: String,
    summary: String,
    captions: [String],
    hashtags: [String],
    story: String,
    scriptures: [scriptureSchema],
    deepAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    socialMediaHooks: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    }
  },
  {
    timestamps: true,
    strict: false // Allow extra fields without failing
  }
);

// Force model re-registration in development to pick up schema changes
if (process.env.NODE_ENV !== 'production' && mongoose.models.GeneratedContent) {
  delete mongoose.models.GeneratedContent;
}

export const ContentModel =
  mongoose.models.GeneratedContent ||
  mongoose.model<GeneratedContent>('GeneratedContent', generatedContentSchema);

