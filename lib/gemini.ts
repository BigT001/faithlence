import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult } from '@/types/content';
import { FAITH_SYSTEM_PROMPT, FAITH_CHAT_PROMPT, generateUserPrompt } from '@/lib/prompts';
import { logger } from '@/lib/logger';

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  logger.error('Gemini', 'GOOGLE_API_KEY not configured', new Error('Missing API key'));
  throw new Error('Please define the GOOGLE_API_KEY environment variable inside .env.local');
}

logger.success('Gemini', 'API Key configured', { hasKey: !!API_KEY });

const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeWithGemini(transcription: string): Promise<AnalysisResult> {
  logger.info('Gemini', 'Starting analysis', { textLength: transcription.length });

  try {
    // Verified models available in this environment
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
    let lastError: any = null;
    let result: any = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info('Gemini', `Attempting analysis with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: FAITH_SYSTEM_PROMPT,
        });

        const userPrompt = generateUserPrompt(transcription);

        // Internal retry logic for each model
        let retries = 0;
        const maxRetries = 2;
        while (retries < maxRetries) {
          try {
            result = await model.generateContent(userPrompt);
            break;
          } catch (error: any) {
            if (error.message?.includes('429') || error.status === 429) {
              retries++;
              const delay = Math.pow(2, retries) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }

        if (result) {
          logger.success('Gemini', `Successfully used model: ${modelName}`);
          break;
        }
      } catch (error: any) {
        lastError = error;
        logger.warn('Gemini', `Model ${modelName} failed`, { error: error.message });
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini models failed to generate content');
    }

    logger.success('Gemini', 'Response received from API');

    const responseText = result.response.text();
    logger.debug('Gemini', 'Response text extracted', { responseLength: responseText.length });

    // Extract JSON from response (in case there's any markdown wrapper)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('Gemini', 'No JSON found in response', new Error('JSON parse failed'), {
        responsePreview: responseText.substring(0, 200),
      });
      throw new Error('No JSON found in response');
    }

    logger.debug('Gemini', 'JSON extracted', { jsonLength: jsonMatch[0].length });

    const parsedResponse = JSON.parse(jsonMatch[0]) as AnalysisResult;
    logger.success('Gemini', 'Analysis complete and parsed', {
      summaryLength: parsedResponse.summary.length,
      captions: parsedResponse.captions.length,
      scriptures: parsedResponse.scriptures.length,
    });

    return parsedResponse;
  } catch (error) {
    logger.error('Gemini', 'Analysis failed', error, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw error;
  }
}

export async function chatWithGemini(
  transcription: string,
  message: string,
  history: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  logger.info('Gemini', 'Starting chat', { messageLength: message.length, historyLength: history.length });

  try {
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
    let lastError: any = null;
    let result: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: `${FAITH_CHAT_PROMPT}\n\nCONTEXT TRANSCRIPTION:\n"${transcription}"`,
        });

        const chat = model.startChat({
          history: history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });

        const chatResult = await chat.sendMessage(message);
        result = chatResult.response.text();

        if (result) {
          logger.success('Gemini:Chat', `Successfully used model: ${modelName}`);
          break;
        }
      } catch (error: any) {
        lastError = error;
        logger.warn('Gemini:Chat', `Model ${modelName} failed`, { error: error.message });
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini models failed to generate chat response');
    }

    return result;
  } catch (error) {
    logger.error('Gemini:Chat', 'Chat failed', error);
    throw error;
  }
}
