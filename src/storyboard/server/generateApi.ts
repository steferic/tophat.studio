/**
 * Vite plugin that adds API endpoints for AI generation.
 * Runs server-side in Node.js, calls OpenAI/Google APIs directly.
 *
 * Endpoints:
 *   POST /api/generate/image   — generate an image (supports referenceImage)
 *   POST /api/generate/video   — generate a video (supports referenceImage as first frame)
 *   POST /api/extract-frame    — extract last frame from a video asset
 *   GET  /api/assets           — list all generated assets
 */

import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve, extname } from 'path';
import { execSync } from 'child_process';

const AI_DIR = join(process.cwd(), 'public', 'ai');
const PUBLIC_DIR = join(process.cwd(), 'public');
const ENV_PATH = resolve(process.cwd(), '.env');

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const env: Record<string, string> = {};
  for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq)] = value;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function saveFile(buffer: Buffer, slug: string, ext: string, meta: Record<string, unknown>): string {
  ensureDir(AI_DIR);
  const filename = `${slug}-${timestamp()}${ext}`;
  const filePath = join(AI_DIR, filename);
  writeFileSync(filePath, buffer);
  writeFileSync(filePath + '.meta.json', JSON.stringify(meta, null, 2));
  return `ai/${filename}`;
}

/** Resolve an asset path (relative to public/) to an absolute path */
function resolveAssetPath(assetPath: string): string {
  // Strip leading slash if present
  const cleaned = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return join(PUBLIC_DIR, cleaned);
}

/** Read an image file and return its base64 data */
function readImageAsBase64(assetPath: string): string {
  const absPath = resolveAssetPath(assetPath);
  if (!existsSync(absPath)) throw new Error(`Reference image not found: ${assetPath}`);
  return readFileSync(absPath).toString('base64');
}

// ---------------------------------------------------------------------------
// Frame extraction
// ---------------------------------------------------------------------------

function extractLastFrame(videoAssetPath: string): string {
  const absPath = resolveAssetPath(videoAssetPath);
  if (!existsSync(absPath)) throw new Error(`Video not found: ${videoAssetPath}`);

  ensureDir(AI_DIR);
  const slug = `lastframe-${timestamp()}`;
  const outFilename = `${slug}.png`;
  const outPath = join(AI_DIR, outFilename);

  // Use ffmpeg to extract the last frame
  // First get the duration, then seek to near the end
  try {
    // Get duration
    const probeOut = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${absPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const duration = parseFloat(probeOut);
    if (isNaN(duration)) throw new Error('Could not determine video duration');

    // Seek to 0.1s before end and grab the last frame
    const seekTo = Math.max(0, duration - 0.1);
    execSync(
      `ffmpeg -y -ss ${seekTo} -i "${absPath}" -frames:v 1 -q:v 2 "${outPath}"`,
      { stdio: 'pipe' }
    );

    if (!existsSync(outPath)) throw new Error('ffmpeg did not produce output');

    // Write metadata
    const meta = {
      type: 'image',
      extractedFrom: videoAssetPath,
      generatedAt: new Date().toISOString(),
      fileSize: readFileSync(outPath).length,
    };
    writeFileSync(outPath + '.meta.json', JSON.stringify(meta, null, 2));

    return `ai/${outFilename}`;
  } catch (err: any) {
    // If ffmpeg is not available, throw a helpful error
    if (err.message?.includes('ENOENT') || err.message?.includes('not found')) {
      throw new Error(
        'ffmpeg is required for frame extraction. Install it with: brew install ffmpeg'
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Image generation (with optional reference image)
// ---------------------------------------------------------------------------

async function generateImage(
  prompt: string,
  model: string,
  opts: { size?: string; quality?: string; negativePrompt?: string; referenceImage?: string }
): Promise<{ assetPath: string; meta: Record<string, unknown> }> {
  const env = loadEnv();
  const slug = slugify(prompt);

  if (model === 'gpt-image-1') {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') throw new Error('OPENAI_API_KEY not set in .env');

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    if (opts.referenceImage) {
      // Image edit mode: use the reference image as input
      const refAbsPath = resolveAssetPath(opts.referenceImage);
      if (!existsSync(refAbsPath)) throw new Error(`Reference image not found: ${opts.referenceImage}`);
      const imageFile = await (await import('fs/promises')).readFile(refAbsPath);

      const result = await openai.images.edit({
        model: 'gpt-image-1',
        image: new File([imageFile], 'reference.png', { type: 'image/png' }),
        prompt,
        size: (opts.size as '1024x1024' | '1536x1024' | '1024x1536') ?? '1536x1024',
        n: 1,
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image data returned');
      const buffer = Buffer.from(b64, 'base64');
      const meta = {
        prompt, model, generatedAt: new Date().toISOString(), type: 'image',
        fileSize: buffer.length, referenceImage: opts.referenceImage,
        params: { size: opts.size ?? '1536x1024', quality: opts.quality ?? 'high', mode: 'edit' },
      };
      const assetPath = saveFile(buffer, slug, '.png', meta);
      return { assetPath, meta };
    }

    // Standard generation (no reference)
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: (opts.size as '1024x1024' | '1536x1024' | '1024x1536') ?? '1536x1024',
      quality: (opts.quality as 'low' | 'medium' | 'high') ?? 'high',
      n: 1,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned');
    const buffer = Buffer.from(b64, 'base64');
    const meta = {
      prompt, model, generatedAt: new Date().toISOString(), type: 'image',
      fileSize: buffer.length,
      params: { size: opts.size ?? '1536x1024', quality: opts.quality ?? 'high' },
    };
    const assetPath = saveFile(buffer, slug, '.png', meta);
    return { assetPath, meta };
  }

  if (model === 'dall-e-3') {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') throw new Error('OPENAI_API_KEY not set in .env');

    // DALL-E 3 does not support image input — ignore referenceImage
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt: opts.referenceImage
        ? `Based on the visual style/content of the reference, ${prompt}`
        : prompt,
      size: (opts.size as '1024x1024' | '1792x1024' | '1024x1792') ?? '1792x1024',
      quality: (opts.quality as 'hd' | 'standard') ?? 'hd',
      n: 1,
      response_format: 'b64_json',
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned');
    const buffer = Buffer.from(b64, 'base64');
    const meta = {
      prompt, model, generatedAt: new Date().toISOString(), type: 'image',
      fileSize: buffer.length,
      params: { size: opts.size ?? '1792x1024', quality: opts.quality ?? 'hd', revisedPrompt: result.data?.[0]?.revised_prompt },
    };
    const assetPath = saveFile(buffer, slug, '.png', meta);
    return { assetPath, meta };
  }

  if (model === 'imagen-4') {
    const apiKey = env.GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') throw new Error('GOOGLE_API_KEY not set in .env');

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    if (opts.referenceImage) {
      // Use editImage with a subject reference
      const imageBytes = readImageAsBase64(opts.referenceImage);
      const response = await ai.models.editImage({
        model: 'imagen-3.0-capability-001',
        prompt,
        referenceImages: [{
          referenceImage: {
            image: { imageBytes },
          },
          referenceType: 'STYLE',
        } as any],
        config: {
          numberOfImages: 1,
          ...(opts.negativePrompt ? { negativePrompt: opts.negativePrompt } : {}),
        },
      } as any);
      const imageData = (response as any).generatedImages?.[0]?.image?.imageBytes;
      if (!imageData) throw new Error('No image data from Imagen edit');
      const buffer = Buffer.from(imageData, 'base64');
      const meta = {
        prompt, model, generatedAt: new Date().toISOString(), type: 'image',
        fileSize: buffer.length, referenceImage: opts.referenceImage,
      };
      const assetPath = saveFile(buffer, slug, '.png', meta);
      return { assetPath, meta };
    }

    // Standard generation
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        ...(opts.negativePrompt ? { negativePrompt: opts.negativePrompt } : {}),
      },
    });
    const imageData = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageData) throw new Error('No image data from Imagen 4');
    const buffer = Buffer.from(imageData, 'base64');
    const meta = { prompt, model, generatedAt: new Date().toISOString(), type: 'image', fileSize: buffer.length };
    const assetPath = saveFile(buffer, slug, '.png', meta);
    return { assetPath, meta };
  }

  throw new Error(`Unknown image model: ${model}`);
}

// ---------------------------------------------------------------------------
// Video generation (with optional reference image as first frame)
// ---------------------------------------------------------------------------

async function generateVideo(
  prompt: string,
  model: string,
  opts: { duration?: number; referenceImage?: string }
): Promise<{ assetPath: string; meta: Record<string, unknown> }> {
  const env = loadEnv();
  const slug = slugify(prompt);

  if (model === 'veo-2') {
    const apiKey = env.GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') throw new Error('GOOGLE_API_KEY not set in .env');

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, unknown> = { numberOfVideos: 1 };
    if (opts.duration) config.durationSeconds = Math.min(8, Math.max(5, opts.duration));

    // Build request — optionally include reference image as first frame
    const generateRequest: Record<string, unknown> = {
      model: 'veo-2.0-generate-001',
      prompt,
      config,
    };

    if (opts.referenceImage) {
      const imageBytes = readImageAsBase64(opts.referenceImage);
      const ext = opts.referenceImage.toLowerCase();
      const mimeType = ext.endsWith('.png') ? 'image/png' : ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      generateRequest.image = { imageBytes, mimeType };
    }

    let operation = await ai.models.generateVideos(
      generateRequest as unknown as Parameters<typeof ai.models.generateVideos>[0]
    );

    const startTime = Date.now();
    while (!operation.done) {
      if (Date.now() - startTime > 5 * 60 * 1000) throw new Error('Video generation timed out');
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUri: string | undefined = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error('No video URI in response');

    const videoUrl = `${videoUri}&key=${apiKey}`;
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Failed to download video: ${videoRes.status}`);
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    const meta = {
      prompt, model, generatedAt: new Date().toISOString(), type: 'video',
      duration: opts.duration ?? 5, fileSize: buffer.length,
      ...(opts.referenceImage ? { referenceImage: opts.referenceImage } : {}),
    };
    const assetPath = saveFile(buffer, slug, '.mp4', meta);
    return { assetPath, meta };
  }

  throw new Error(`Unknown video model: ${model}`);
}

// ---------------------------------------------------------------------------
// List assets
// ---------------------------------------------------------------------------

function listAssets(): Array<{ filename: string; path: string; type: string; meta?: Record<string, unknown> }> {
  if (!existsSync(AI_DIR)) return [];
  const files = readdirSync(AI_DIR).filter((f) => !f.endsWith('.meta.json'));
  return files.map((filename) => {
    const filePath = join(AI_DIR, filename);
    const metaPath = filePath + '.meta.json';
    let meta: Record<string, unknown> | undefined;
    if (existsSync(metaPath)) {
      try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')); } catch { /* ignore */ }
    }
    const type = extname(filename) === '.mp4' ? 'video' : 'image';
    return { filename, path: `ai/${filename}`, type, meta };
  });
}

// ---------------------------------------------------------------------------
// Vite Plugin
// ---------------------------------------------------------------------------

export function generateApiPlugin(): Plugin {
  return {
    name: 'generate-api',
    configureServer(server) {
      const parseBody = (req: any): Promise<any> =>
        new Promise((resolve, reject) => {
          let body = '';
          req.on('data', (chunk: string) => { body += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
          });
        });

      server.middlewares.use(async (req, res, next) => {
        // POST /api/generate/image
        if (req.url === '/api/generate/image' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            const result = await generateImage(body.prompt, body.model ?? 'dall-e-3', {
              size: body.size,
              quality: body.quality,
              negativePrompt: body.negativePrompt,
              referenceImage: body.referenceImage,
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/generate/video
        if (req.url === '/api/generate/video' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            console.log(`[generate/video] prompt="${body.prompt?.slice(0, 50)}..." model=${body.model} ref=${body.referenceImage ?? 'none'}`);
            const result = await generateVideo(body.prompt, body.model ?? 'veo-2', {
              duration: body.duration,
              referenceImage: body.referenceImage,
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[generate/video] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/extract-frame — extract last frame from a video
        if (req.url === '/api/extract-frame' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            if (!body.videoPath) throw new Error('videoPath is required');
            const framePath = extractLastFrame(body.videoPath);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ framePath }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // GET /api/assets
        if (req.url === '/api/assets' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(listAssets()));
          return;
        }

        next();
      });
    },
  };
}
