/**
 * Unified AI Generation Script
 *
 * Generate images and videos using OpenAI and Google AI models.
 * Assets are saved to public/ai/ with .meta.json sidecar files.
 *
 * Usage:
 *   npx tsx scripts/generate.ts image "prompt" --model=dall-e-3
 *   npx tsx scripts/generate.ts video "prompt" --model=veo-2 --duration=5
 *   npx tsx scripts/generate.ts animate public/ai/image.png "prompt" --model=veo-2
 *   npx tsx scripts/generate.ts batch src/projects/my.project.ts
 *   npx tsx scripts/generate.ts list
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, extname, basename } from 'path';
import type { AssetMeta, AIModel } from '../src/types/project';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AI_DIR = join(process.cwd(), 'public', 'ai');
const ENV_PATH = resolve(process.cwd(), '.env');

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) {
    return {};
  }
  const env: Record<string, string> = {};
  for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq)] = value;
  }
  return env;
}

function requireKey(env: Record<string, string>, key: string): string {
  const val = env[key];
  if (!val || val === 'your_key_here') {
    console.error(`Error: ${key} not set in .env`);
    console.error(`Add it to your .env file: ${key}=your_key_here`);
    process.exit(1);
  }
  return val;
}

// ---------------------------------------------------------------------------
// Slug / filename helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// OpenAI Image Generation
// ---------------------------------------------------------------------------

async function generateOpenAIImage(
  apiKey: string,
  prompt: string,
  opts: { model: 'dall-e-3' | 'gpt-image-1'; size?: string; quality?: string }
): Promise<{ buffer: Buffer; meta: AssetMeta }> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey });

  console.log(`  Model: ${opts.model}`);
  console.log(`  Size: ${opts.size ?? '1792x1024'}`);
  console.log(`  Quality: ${opts.quality ?? 'hd'}`);
  console.log('  Generating...\n');

  if (opts.model === 'gpt-image-1') {
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
    const [w, h] = (opts.size ?? '1536x1024').split('x').map(Number);

    return {
      buffer,
      meta: {
        prompt,
        model: 'gpt-image-1',
        generatedAt: new Date().toISOString(),
        params: { size: opts.size ?? '1536x1024', quality: opts.quality ?? 'high' },
        type: 'image',
        width: w,
        height: h,
        fileSize: buffer.length,
      },
    };
  }

  // dall-e-3
  const result = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: (opts.size as '1024x1024' | '1792x1024' | '1024x1792') ?? '1792x1024',
    quality: (opts.quality as 'hd' | 'standard') ?? 'hd',
    n: 1,
    response_format: 'b64_json',
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');
  const buffer = Buffer.from(b64, 'base64');
  const [w, h] = (opts.size ?? '1792x1024').split('x').map(Number);

  return {
    buffer,
    meta: {
      prompt,
      model: 'dall-e-3',
      generatedAt: new Date().toISOString(),
      params: {
        size: opts.size ?? '1792x1024',
        quality: opts.quality ?? 'hd',
        revisedPrompt: result.data?.[0]?.revised_prompt,
      },
      type: 'image',
      width: w,
      height: h,
      fileSize: buffer.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Google Imagen 3 Image Generation
// ---------------------------------------------------------------------------

async function generateGoogleImage(
  apiKey: string,
  prompt: string,
  opts: { size?: string; negativePrompt?: string }
): Promise<{ buffer: Buffer; meta: AssetMeta }> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  console.log('  Model: imagen-4');
  console.log(`  Prompt: "${prompt}"`);
  console.log('  Generating...\n');

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-fast-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      ...(opts.negativePrompt ? { negativePrompt: opts.negativePrompt } : {}),
    },
  });

  const imageData = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageData) throw new Error('No image data returned from Imagen 3');

  const buffer = Buffer.from(imageData, 'base64');

  return {
    buffer,
    meta: {
      prompt,
      model: 'imagen-4',
      generatedAt: new Date().toISOString(),
      params: { negativePrompt: opts.negativePrompt },
      type: 'image',
      fileSize: buffer.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Google Veo 2 Video Generation
// ---------------------------------------------------------------------------

async function generateGoogleVideo(
  apiKey: string,
  prompt: string,
  opts: { duration?: number; imagePath?: string }
): Promise<{ buffer: Buffer; meta: AssetMeta }> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  console.log('  Model: veo-2');
  console.log(`  Prompt: "${prompt}"`);
  if (opts.imagePath) console.log(`  Reference image: ${opts.imagePath}`);
  console.log('  Generating (this may take a few minutes)...\n');

  // Build the generation config
  const config: Record<string, unknown> = {
    numberOfVideos: 1,
  };
  if (opts.duration) {
    // Veo 2 supports 5-8 second clips
    config.durationSeconds = Math.min(8, Math.max(5, opts.duration));
  }

  // Build generation request
  const generateRequest: Parameters<typeof ai.models.generateVideos>[0] = {
    model: 'veo-2.0-generate-001',
    prompt,
    config,
  };
  if (opts.imagePath) {
    const imgPath = resolve(process.cwd(), opts.imagePath);
    if (!existsSync(imgPath)) {
      throw new Error(`Image not found: ${imgPath}`);
    }
    const imgBuffer = readFileSync(imgPath);
    const ext = imgPath.toLowerCase();
    const mimeType = ext.endsWith('.png') ? 'image/png' : ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    generateRequest.image = {
      imageBytes: imgBuffer.toString('base64'),
      mimeType,
    } as typeof generateRequest.image;
  }

  let operation = await ai.models.generateVideos(generateRequest);

  // Poll for completion
  const startTime = Date.now();
  const maxWaitMs = 5 * 60 * 1000; // 5 minutes

  while (!operation.done) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Video generation timed out after 5 minutes');
    }
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`\r  Waiting... ${elapsed}s elapsed`);
    await new Promise((r) => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }
  console.log(''); // newline after progress

  const videoUri: string | undefined = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!videoUri) {
    throw new Error('No video URI in response');
  }

  console.log('  Downloading generated video...');
  const videoUrl = `${videoUri}&key=${apiKey}`;
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download video: ${videoRes.status}`);
  const buffer = Buffer.from(await videoRes.arrayBuffer());

  return {
    buffer,
    meta: {
      prompt,
      model: 'veo-2',
      generatedAt: new Date().toISOString(),
      params: {
        duration: opts.duration,
        hasReferenceImage: !!opts.imagePath,
      },
      type: 'video',
      duration: opts.duration ?? 5,
      fileSize: buffer.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Save asset
// ---------------------------------------------------------------------------

function saveAsset(
  buffer: Buffer,
  meta: AssetMeta,
  slug: string,
  ext: string
): string {
  ensureDir(AI_DIR);

  const filename = `${slug}-${timestamp()}${ext}`;
  const filePath = join(AI_DIR, filename);
  const metaPath = join(AI_DIR, `${filename}.meta.json`);

  writeFileSync(filePath, buffer);
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  const sizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`  Saved: public/ai/${filename} (${sizeKB} KB)`);
  console.log(`  Meta:  public/ai/${filename}.meta.json`);

  return `ai/${filename}`;
}

// ---------------------------------------------------------------------------
// CLI: image command
// ---------------------------------------------------------------------------

async function cmdImage(prompt: string, flags: Record<string, string>) {
  const env = loadEnv();
  const model = (flags.model ?? 'dall-e-3') as AIModel;
  const slug = flags.output ? basename(flags.output, extname(flags.output)) : slugify(prompt);

  console.log(`\nGenerating image:`);
  console.log(`  Prompt: "${prompt}"`);

  if (model === 'dall-e-3' || model === 'gpt-image-1') {
    const apiKey = requireKey(env, 'OPENAI_API_KEY');
    const { buffer, meta } = await generateOpenAIImage(apiKey, prompt, {
      model,
      size: flags.size,
      quality: flags.quality,
    });
    const path = saveAsset(buffer, meta, slug, '.png');
    printUsage(path, 'image');
  } else if (model === 'imagen-4') {
    const apiKey = requireKey(env, 'GOOGLE_API_KEY');
    const { buffer, meta } = await generateGoogleImage(apiKey, prompt, {
      size: flags.size,
      negativePrompt: flags['negative-prompt'],
    });
    const path = saveAsset(buffer, meta, slug, '.png');
    printUsage(path, 'image');
  } else {
    console.error(`Unknown image model: ${model}`);
    console.error('Available: dall-e-3, gpt-image-1, imagen-4');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI: video command
// ---------------------------------------------------------------------------

async function cmdVideo(prompt: string, flags: Record<string, string>) {
  const env = loadEnv();
  const model = (flags.model ?? 'veo-2') as AIModel;
  const duration = parseFloat(flags.duration ?? '5');
  const slug = flags.output ? basename(flags.output, extname(flags.output)) : slugify(prompt);

  console.log(`\nGenerating video:`);
  console.log(`  Prompt: "${prompt}"`);

  if (model === 'veo-2') {
    const apiKey = requireKey(env, 'GOOGLE_API_KEY');
    const { buffer, meta } = await generateGoogleVideo(apiKey, prompt, { duration });
    const path = saveAsset(buffer, meta, slug, '.mp4');
    printUsage(path, 'video');
  } else if (model === 'sora') {
    console.error('Sora API support coming soon. Use --model=veo-2 for now.');
    process.exit(1);
  } else {
    console.error(`Unknown video model: ${model}`);
    console.error('Available: veo-2');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI: animate command (image-to-video)
// ---------------------------------------------------------------------------

async function cmdAnimate(imagePath: string, prompt: string, flags: Record<string, string>) {
  const env = loadEnv();
  const model = (flags.model ?? 'veo-2') as AIModel;
  const duration = parseFloat(flags.duration ?? '5');
  const slug = flags.output
    ? basename(flags.output, extname(flags.output))
    : `animate-${slugify(prompt)}`;

  console.log(`\nAnimating image:`);
  console.log(`  Image: ${imagePath}`);
  console.log(`  Prompt: "${prompt}"`);

  if (model === 'veo-2') {
    const apiKey = requireKey(env, 'GOOGLE_API_KEY');
    const { buffer, meta } = await generateGoogleVideo(apiKey, prompt, {
      duration,
      imagePath,
    });
    const path = saveAsset(buffer, meta, slug, '.mp4');
    printUsage(path, 'video');
  } else {
    console.error(`Image-to-video only supported with veo-2 currently.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI: batch command
// ---------------------------------------------------------------------------

async function cmdBatch(projectPath: string, flags: Record<string, string>) {
  const absPath = resolve(process.cwd(), projectPath);
  if (!existsSync(absPath)) {
    console.error(`Project file not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`\nBatch generating from: ${projectPath}`);

  // Dynamic import of the project file
  const mod = await import(absPath);
  const project = mod.project ?? mod.default;

  if (!project?.scenes) {
    console.error('Project file must export a `project` or default with a `scenes` array.');
    process.exit(1);
  }

  const env = loadEnv();
  const dryRun = flags['dry-run'] !== undefined;
  let generated = 0;
  let skipped = 0;

  for (const scene of project.scenes) {
    if (scene.type !== 'ai-video' && scene.type !== 'ai-image') {
      continue;
    }
    if (scene.assetPath) {
      console.log(`  [skip] ${scene.id}: already has asset at ${scene.assetPath}`);
      skipped++;
      continue;
    }

    console.log(`\n  --- Scene: ${scene.id} ---`);

    if (dryRun) {
      console.log(`  [dry-run] Would generate ${scene.type} with model ${scene.model}`);
      console.log(`  [dry-run] Prompt: "${scene.prompt}"`);
      continue;
    }

    try {
      if (scene.type === 'ai-image') {
        const model = scene.model as AIModel;
        const slug = slugify(scene.id);

        if (model === 'dall-e-3' || model === 'gpt-image-1') {
          const apiKey = requireKey(env, 'OPENAI_API_KEY');
          const { buffer, meta } = await generateOpenAIImage(apiKey, scene.prompt, {
            model,
            size: scene.size,
            quality: scene.quality,
          });
          scene.assetPath = saveAsset(buffer, meta, slug, '.png');
        } else if (model === 'imagen-4') {
          const apiKey = requireKey(env, 'GOOGLE_API_KEY');
          const { buffer, meta } = await generateGoogleImage(apiKey, scene.prompt, {
            negativePrompt: scene.negativePrompt,
          });
          scene.assetPath = saveAsset(buffer, meta, slug, '.png');
        }
        generated++;
      } else if (scene.type === 'ai-video') {
        const model = scene.model as AIModel;
        const slug = slugify(scene.id);

        if (model === 'veo-2') {
          const apiKey = requireKey(env, 'GOOGLE_API_KEY');
          const { buffer, meta } = await generateGoogleVideo(apiKey, scene.prompt, {
            duration: scene.duration,
          });
          scene.assetPath = saveAsset(buffer, meta, slug, '.mp4');
        }
        generated++;
      }
    } catch (err) {
      console.error(`  [error] Failed to generate ${scene.id}: ${err}`);
    }
  }

  console.log(`\nBatch complete: ${generated} generated, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// CLI: list command
// ---------------------------------------------------------------------------

function cmdList() {
  if (!existsSync(AI_DIR)) {
    console.log('\nNo generated assets yet. Run a generate command first.');
    return;
  }

  const files = readdirSync(AI_DIR).filter((f) => !f.endsWith('.meta.json'));

  if (files.length === 0) {
    console.log('\nNo generated assets yet.');
    return;
  }

  console.log(`\nGenerated assets (${files.length}):\n`);
  console.log('  File                                          Type    Size      Model');
  console.log('  ' + '-'.repeat(80));

  for (const file of files) {
    const filePath = join(AI_DIR, file);
    const metaPath = filePath + '.meta.json';
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(0) + ' KB';

    let model = '?';
    let type = extname(file) === '.mp4' ? 'video' : 'image';

    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as AssetMeta;
        model = meta.model;
        type = meta.type;
      } catch {
        // ignore parse errors
      }
    }

    console.log(
      `  ${file.padEnd(48)}${type.padEnd(8)}${sizeKB.padEnd(10)}${model}`
    );
  }

  console.log(`\nUsage: staticFile('ai/<filename>') in Remotion compositions`);
}

// ---------------------------------------------------------------------------
// Usage hints
// ---------------------------------------------------------------------------

function printUsage(assetPath: string, type: 'image' | 'video') {
  console.log('\nUsage in Remotion:');
  if (type === 'image') {
    console.log(`  import { Img, staticFile } from 'remotion';`);
    console.log(`  <Img src={staticFile('${assetPath}')} />`);
  } else {
    console.log(`  import { OffthreadVideo, staticFile } from 'remotion';`);
    console.log(`  <OffthreadVideo src={staticFile('${assetPath}')} />`);
  }
  console.log(`\nOr add to a project manifest:`);
  console.log(`  { type: '${type === 'image' ? 'ai-image' : 'ai-video'}', assetPath: '${assetPath}', ... }`);
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        flags[arg.slice(2)] = 'true';
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
tophat.studio - AI Asset Generator

Commands:
  image <prompt>                    Generate an image
  video <prompt>                    Generate a video
  animate <image-path> <prompt>     Animate an image into a video
  batch <project-file>              Generate all assets for a project
  list                              List generated assets

Image Options:
  --model=MODEL         Model: dall-e-3 (default), gpt-image-1, imagen-4
  --size=WxH            Size: 1792x1024 (dall-e-3), 1536x1024 (gpt-image-1)
  --quality=QUALITY     Quality: hd/standard (dall-e-3), low/medium/high (gpt-image-1)
  --negative-prompt=X   Negative prompt (imagen-4 only)
  --output=FILENAME     Output filename (auto-generated if omitted)

Video Options:
  --model=MODEL         Model: veo-2 (default)
  --duration=SECONDS    Duration: 5-8 seconds (default: 5)
  --output=FILENAME     Output filename (auto-generated if omitted)

Batch Options:
  --dry-run             Show what would be generated without calling APIs

Environment:
  Set API keys in .env:
    OPENAI_API_KEY=sk-...
    GOOGLE_API_KEY=AIza...

Examples:
  npx tsx scripts/generate.ts image "a nebula in deep space, photorealistic"
  npx tsx scripts/generate.ts image "product shot of headphones" --model=gpt-image-1
  npx tsx scripts/generate.ts image "a mountain landscape" --model=imagen-4
  npx tsx scripts/generate.ts video "camera pushes through nebula clouds" --model=veo-2
  npx tsx scripts/generate.ts animate public/ai/nebula.png "slow zoom with particles"
  npx tsx scripts/generate.ts batch src/projects/my-video.project.ts
  npx tsx scripts/generate.ts batch src/projects/my-video.project.ts --dry-run
  npx tsx scripts/generate.ts list
`);
}

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (!command || flags.help !== undefined) {
    printHelp();
    return;
  }

  switch (command) {
    case 'image': {
      const prompt = positional[1];
      if (!prompt) {
        console.error('Error: prompt required. Usage: generate.ts image "your prompt"');
        process.exit(1);
      }
      await cmdImage(prompt, flags);
      break;
    }

    case 'video': {
      const prompt = positional[1];
      if (!prompt) {
        console.error('Error: prompt required. Usage: generate.ts video "your prompt"');
        process.exit(1);
      }
      await cmdVideo(prompt, flags);
      break;
    }

    case 'animate': {
      const imagePath = positional[1];
      const prompt = positional[2];
      if (!imagePath || !prompt) {
        console.error('Error: image path and prompt required.');
        console.error('Usage: generate.ts animate <image-path> "your prompt"');
        process.exit(1);
      }
      await cmdAnimate(imagePath, prompt, flags);
      break;
    }

    case 'batch': {
      const projectPath = positional[1];
      if (!projectPath) {
        console.error('Error: project file required. Usage: generate.ts batch <project-file>');
        process.exit(1);
      }
      await cmdBatch(projectPath, flags);
      break;
    }

    case 'list': {
      cmdList();
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
