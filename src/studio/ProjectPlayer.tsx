/**
 * ProjectPlayer - Renders a VideoProject manifest as a Remotion composition.
 *
 * Takes a project manifest and renders each scene in sequence with transitions,
 * audio layers, and Ken Burns effects. Supports AI-generated assets, existing
 * Remotion compositions, raw video files, and static images.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Audio,
  Img,
  staticFile,
  Sequence,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type {
  VideoProject,
  Scene,
  TransitionType,
  AudioLayer,
} from '../types/project';
import { KenBurns } from './KenBurns';
import { FormulaOverlay } from './FormulaOverlay';

// ---------------------------------------------------------------------------
// Transition resolver
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransitionPresentation(type: TransitionType): any {
  switch (type) {
    case 'crossfade':
    case 'fade':
    case 'dissolve':
      return fade();
    case 'slide':
      return slide({ direction: 'from-right' });
    case 'wipe':
      return wipe({ direction: 'from-left' });
    case 'iris':
    case 'zoom':
      return fade();
    case 'none':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------

const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case 'ai-video':
      return <AIVideoSceneView src={scene.assetPath} />;
    case 'ai-image':
      return (
        <AIImageSceneView
          src={scene.assetPath}
          animation={scene.animation}
        />
      );
    case 'video':
      return (
        <VideoSceneView
          src={scene.src}
          trim={scene.trim}
          playbackRate={scene.playbackRate}
          volume={scene.volume}
        />
      );
    case 'image':
      return (
        <ImageSceneView
          src={scene.src}
          animation={scene.animation}
        />
      );
    case 'composition':
      return (
        <CompositionSceneView
          compositionId={scene.compositionId}
          props={scene.props}
        />
      );
    default:
      return <PlaceholderScene label="Unknown scene type" />;
  }
};

const SceneWithFormula: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (scene.formulaMeta) {
    return (
      <FormulaOverlay style={scene.formulaMeta.style} purpose={scene.formulaMeta.purpose}>
        <SceneRenderer scene={scene} />
      </FormulaOverlay>
    );
  }
  return <SceneRenderer scene={scene} />;
};

// --- AI Video ---
const AIVideoSceneView: React.FC<{ src?: string }> = ({ src }) => {
  if (!src) return <PlaceholderScene label="AI Video (not yet generated)" color="#1a1a4a" />;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

// --- AI Image ---
const AIImageSceneView: React.FC<{
  src?: string;
  animation?: string;
}> = ({ src, animation }) => {
  if (!src) return <PlaceholderScene label="AI Image (not yet generated)" color="#1a3a1a" />;

  if (animation) {
    return <KenBurns src={staticFile(src)} preset={animation as Parameters<typeof KenBurns>[0]['preset']} />;
  }

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

// --- Raw Video ---
const VideoSceneView: React.FC<{
  src: string;
  trim?: [number, number];
  playbackRate?: number;
  volume?: number;
}> = ({ src, trim, playbackRate, volume }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        startFrom={trim ? Math.round(trim[0] * fps) : undefined}
        endAt={trim ? Math.round(trim[1] * fps) : undefined}
        playbackRate={playbackRate}
        volume={volume}
      />
    </AbsoluteFill>
  );
};

// --- Static Image ---
const ImageSceneView: React.FC<{
  src: string;
  animation?: string;
}> = ({ src, animation }) => {
  if (animation) {
    return <KenBurns src={staticFile(src)} preset={animation as Parameters<typeof KenBurns>[0]['preset']} />;
  }

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

// --- Composition reference ---
const CompositionSceneView: React.FC<{
  compositionId: string;
  props?: Record<string, unknown>;
}> = ({ compositionId, props }) => {
  // Composition references show a placeholder in the player.
  // In production, you'd dynamically resolve and render the composition.
  return (
    <PlaceholderScene
      label={`Composition: ${compositionId}`}
      color="#2a1a3a"
      detail={props ? JSON.stringify(props, null, 2) : undefined}
    />
  );
};

// --- Placeholder for ungenerated / unknown scenes ---
const PlaceholderScene: React.FC<{
  label: string;
  color?: string;
  detail?: string;
}> = ({ label, color = '#1a1a2a', detail }) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div
      style={{
        fontSize: 32,
        color: 'rgba(255,255,255,0.6)',
        padding: '16px 32px',
        borderRadius: 12,
        border: '2px dashed rgba(255,255,255,0.2)',
        textAlign: 'center',
      }}
    >
      {label}
    </div>
    {detail && (
      <pre
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 16,
          maxWidth: '60%',
          overflow: 'hidden',
        }}
      >
        {detail}
      </pre>
    )}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Audio layer renderer
// ---------------------------------------------------------------------------

const AudioLayerRenderer: React.FC<{
  layer: AudioLayer;
  fps: number;
}> = ({ layer, fps }) => {
  const startFrame = layer.startAt ? Math.round(layer.startAt * fps) : 0;

  return (
    <Sequence from={startFrame} layout="none">
      <Audio
        src={staticFile(layer.src)}
        volume={layer.volume ?? 1}
        startFrom={layer.trimFrom ? Math.round(layer.trimFrom * fps) : undefined}
        endAt={layer.trimTo ? Math.round(layer.trimTo * fps) : undefined}
        loop={layer.loop}
      />
    </Sequence>
  );
};

// ---------------------------------------------------------------------------
// Per-scene audio (voiceover + music)
// ---------------------------------------------------------------------------

const SceneAudioRenderer: React.FC<{
  scene: Scene;
}> = ({ scene }) => {
  if (!scene.audio) return null;

  return (
    <>
      {scene.audio.voiceoverPath && (
        <Audio src={staticFile(scene.audio.voiceoverPath)} volume={1} />
      )}
      {scene.audio.musicPath && (
        <Audio src={staticFile(scene.audio.musicPath)} volume={scene.audio.musicVolume ?? 0.3} />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// ProjectPlayer composition
// ---------------------------------------------------------------------------

export interface ProjectPlayerProps {
  project: VideoProject;
}

export const ProjectPlayer: React.FC<ProjectPlayerProps> = ({ project }) => {
  const { fps } = useVideoConfig();

  const hasTransitions = project.scenes.some(
    (s, i) => i > 0 && (s.transition?.type ?? project.defaultTransition?.type) !== 'none'
  );

  // Use TransitionSeries if any transitions exist, otherwise simple Series
  if (hasTransitions) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
        <TransitionSeries>
          {project.scenes.map((scene, i) => {
            const sceneDuration = Math.round(scene.duration * fps);
            const elements: React.ReactNode[] = [];

            // Add transition before this scene (except first)
            if (i > 0) {
              const t = scene.transition ?? project.defaultTransition;
              if (t && t.type !== 'none') {
                const presentation = getTransitionPresentation(t.type);
                if (presentation) {
                  const transitionFrames = Math.round(t.duration * fps);
                  elements.push(
                    <TransitionSeries.Transition
                      key={`t-${scene.id}`}
                      presentation={presentation}
                      timing={linearTiming({ durationInFrames: transitionFrames })}
                    />
                  );
                }
              }
            }

            // Add the scene
            elements.push(
              <TransitionSeries.Sequence key={scene.id} durationInFrames={sceneDuration}>
                <SceneWithFormula scene={scene} />
                <SceneAudioRenderer scene={scene} />
              </TransitionSeries.Sequence>
            );

            return elements;
          })}
        </TransitionSeries>

        {/* Global audio layers */}
        {project.audioLayers?.map((layer, i) => (
          <AudioLayerRenderer key={`audio-${i}`} layer={layer} fps={fps} />
        ))}
      </AbsoluteFill>
    );
  }

  // No transitions — simple sequential layout
  let frameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {project.scenes.map((scene) => {
        const sceneDuration = Math.round(scene.duration * fps);
        const from = frameOffset;
        frameOffset += sceneDuration;

        return (
          <Sequence key={scene.id} from={from} durationInFrames={sceneDuration} premountFor={fps}>
            <SceneWithFormula scene={scene} />
            <SceneAudioRenderer scene={scene} />
          </Sequence>
        );
      })}

      {/* Global audio layers */}
      {project.audioLayers?.map((layer, i) => (
        <AudioLayerRenderer key={`audio-${i}`} layer={layer} fps={fps} />
      ))}
    </AbsoluteFill>
  );
};

export default ProjectPlayer;
