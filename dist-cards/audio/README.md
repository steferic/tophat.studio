# Audio Assets

Organized audio library for Remotion videos. All audio files are stored via Git LFS.

## Directory Structure

```
audio/
├── music/        # Background music tracks
├── voiceovers/   # Generated voiceovers (from scripts/voiceover.ts)
└── sfx/          # Sound effects
```

## Usage in Remotion

```tsx
import { Audio, staticFile } from 'remotion';

// Music
<Audio src={staticFile('audio/music/argyu-beat.mp3')} volume={0.7} />

// Voiceover
<Audio src={staticFile('audio/voiceovers/my-voiceover.mp3')} />

// Sound effect
<Audio src={staticFile('audio/sfx/whoosh.mp3')} />
```

## Generating Voiceovers

Use the ElevenLabs CLI script:

```bash
# Generate with subtitles (recommended)
npx tsx scripts/voiceover.ts "Your text here" --subtitles --voice=Rachel

# List available voices
npx tsx scripts/voiceover.ts --list-voices
```

## Free Audio Resources

### Music
- [Pixabay Music](https://pixabay.com/music/) - Royalty-free
- [Free Music Archive](https://freemusicarchive.org/) - CC licensed
- [Incompetech](https://incompetech.com/) - Kevin MacLeod's library

### Sound Effects
- [Freesound](https://freesound.org/) - CC licensed samples
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - Royalty-free
- [Zapsplat](https://www.zapsplat.com/) - Free with attribution

## Adding New Audio

1. Drop files into the appropriate subdirectory
2. Git LFS automatically tracks `.mp3` files
3. Commit and push as normal

```bash
cp ~/Downloads/new-track.mp3 public/audio/music/
git add public/audio/music/new-track.mp3
git commit -m "Add new-track music"
```
