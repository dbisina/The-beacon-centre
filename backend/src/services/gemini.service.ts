// backend/src/services/gemini.service.ts
// Thin wrapper over Gemini's REST API (image generation + text
// classification). Deliberately fails loudly when no key is configured
// rather than faking a result - same convention as PaystackService.
import axios from 'axios';

// gemini-2.5-flash-image ("Nano Banana") has a real free tier (500
// images/day). The newer 3.x preview image models have 0 free-tier quota -
// billing-only - regardless of how many keys are in the pool.
const IMAGE_MODEL = 'gemini-2.5-flash-image';
// Plain-text model for classification - much cheaper/faster than the image
// model, and supports responseSchema for guaranteed-shape JSON output.
const TEXT_MODEL = 'gemini-2.5-flash';

const urlFor = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Key pool: set GEMINI_API_KEYS to a comma-separated list (up to 15 keys) to
 * spread requests across multiple free-tier quotas instead of hitting one
 * key's rate limit. Falls back to the single GEMINI_API_KEY var if that's
 * all that's set. Rotates round-robin per call, and on a 429 from one key
 * retries the next key in the pool before giving up.
 */
function getKeyPool(): string[] {
  const listed = process.env.GEMINI_API_KEYS;
  if (listed) {
    const keys = listed.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 15);
    if (keys.length) return keys;
  }
  const single = process.env.GEMINI_API_KEY;
  return single ? [single] : [];
}

let rotation = 0;

/**
 * POSTs `body` to `url`, trying every key in the pool (starting from the
 * next one in rotation) until one succeeds or a non-429 error occurs. A 429
 * on one key rotates to the next; anything else fails immediately since it'd
 * fail the same way on every key.
 */
async function postWithKeyRotation(url: string, body: any): Promise<any> {
  const pool = getKeyPool();
  if (!pool.length) {
    throw new Error('Gemini is not configured (GEMINI_API_KEY/GEMINI_API_KEYS unset)');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < pool.length; attempt++) {
    const key = pool[rotation % pool.length];
    rotation++;

    try {
      return await axios.post(url, body, {
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status !== 429) break;
    }
  }

  const message = axios.isAxiosError(lastError)
    ? lastError.response?.data?.error?.message ?? lastError.message
    : lastError instanceof Error
    ? lastError.message
    : 'Unknown error';
  throw new Error(message);
}

export interface GeneratedImage {
  mimeType: string;
  /** Base64-encoded image bytes. */
  data: string;
}

export interface VideoClassification {
  kind: 'SERMON' | 'EXCERPT' | 'INSPIRATIONAL';
  /** Best-guess speaker name from the description, or null if unclear. */
  speaker: string | null;
  /** e.g. "Love Series" - null if this video isn't part of a series. */
  series: string | null;
  /** Cleaned-up 1-3 sentence description safe to show in the app. */
  description: string;
}

const CLASSIFICATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    kind: { type: 'STRING', enum: ['SERMON', 'EXCERPT', 'INSPIRATIONAL'] },
    speaker: { type: 'STRING', nullable: true },
    series: { type: 'STRING', nullable: true },
    description: { type: 'STRING' },
  },
  required: ['kind', 'description'],
};

export class GeminiService {
  static async generateImage(
    prompt: string,
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '3:4'
  ): Promise<GeneratedImage> {
    try {
      const response = await postWithKeyRotation(urlFor(IMAGE_MODEL), {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio },
        },
      });

      const parts = response.data?.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p: any) => p.inlineData?.data);
      if (!imagePart) throw new Error('Gemini did not return an image');

      return {
        mimeType: imagePart.inlineData.mimeType ?? 'image/png',
        data: imagePart.inlineData.data,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Gemini image generation failed: ${message}`);
    }
  }

  /**
   * Classifies a YouTube video into the app's content model from its title,
   * description, and duration - used by the "sync from YouTube channel"
   * admin bulk-import. `durationSeconds` is given as a hint (very short
   * videos are almost always EXCERPT/INSPIRATIONAL, not SERMON) but the
   * model still judges kind from the actual content, not duration alone.
   */
  static async classifyVideo(params: {
    title: string;
    rawDescription: string;
    durationSeconds: number;
  }): Promise<VideoClassification> {
    const prompt =
      `You are tagging a church's YouTube video for a mobile app. Given the title, the channel's own ` +
      `video description, and the duration, decide:\n` +
      `- kind: "EXCERPT" if it's a short highlight/clip cut from a longer sermon, "INSPIRATIONAL" if it's a ` +
      `short standalone motivational/encouragement clip (not cut from a sermon), or "SERMON" if it's a full-length ` +
      `message/service recording. Videos under ~3 minutes are almost always EXCERPT or INSPIRATIONAL, not SERMON.\n` +
      `- speaker: the preacher/speaker's name if the description names one, else null.\n` +
      `- series: the name of the message series this belongs to (e.g. "Love Series", "Stay Lit") ONLY if the ` +
      `title or description clearly names one, else null. Don't invent a series name.\n` +
      `- description: a clean 1-3 sentence description suitable to show in the app (rewrite the raw description - ` +
      `strip links, hashtags, timestamps, and social-media boilerplate).\n\n` +
      `Title: ${params.title}\n` +
      `Duration: ${params.durationSeconds} seconds\n` +
      `Raw description:\n${params.rawDescription || '(none provided)'}`;

    try {
      const response = await postWithKeyRotation(urlFor(TEXT_MODEL), {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: CLASSIFICATION_SCHEMA,
        },
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini did not return a classification');

      const parsed = JSON.parse(text);
      return {
        kind: parsed.kind === 'EXCERPT' || parsed.kind === 'INSPIRATIONAL' ? parsed.kind : 'SERMON',
        speaker: parsed.speaker || null,
        series: parsed.series || null,
        description: parsed.description || '',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Gemini classification failed: ${message}`);
    }
  }
}
