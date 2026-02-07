/**
 * City Street Video - Diomira
 * Plays a city street video with voiceover from Invisible Cities
 */

import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, Audio, Loop } from 'remotion';
import { Subtitles } from '../components/Subtitles';
import diomiraSubtitles from '../../public/audio/voiceovers/diomira-voiceover.json';

export interface CityStreetProps {
  startFrame?: number;
}

export const CityStreet: React.FC<CityStreetProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Main video - looped to match voiceover length */}
      <Loop durationInFrames={309}>
        <OffthreadVideo
          src={staticFile('videos/city_street.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Loop>

      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceovers/diomira-voiceover.mp3')} />

      {/* Background music - classical, soft */}
      <Audio
        src={staticFile('audio/music/ravel-string-quartet.mp3')}
        volume={0.15}
        startFrom={240}
      />

      {/* Subtitles - show ~12 words at a time for 3 lines max */}
      <Subtitles
        segments={diomiraSubtitles}
        fontSize={24}
        bottomOffset={60}
        maxWidthPercent={90}
        maxWords={12}
      />
    </AbsoluteFill>
  );
};

export default CityStreet;
