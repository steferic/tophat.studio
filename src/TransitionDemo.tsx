import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import {
  ZoomPunch,
  MultiZoomPunch,
  SplitWipe,
  CrossDissolve,
  MaskReveal,
  IrisWipe,
  ShutterReveal,
  LiquidMorph,
  BlobTransition,
  WaveTransition,
} from './transitions';

// Simple colored scene for testing
const ColorScene: React.FC<{
  color: string;
  title: string;
  subtitle?: string;
}> = ({ color, title, subtitle }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 20,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Scene duration for each demo
const SCENE_DURATION = 90; // 1.5 seconds per transition demo
const TRANSITION_DURATION = 30; // 0.5 seconds for the transition itself

/**
 * Transition Demo Composition
 * Showcases all available transitions
 */
export const TransitionDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Define all transitions to demo
  const transitions = [
    { name: 'Split Wipe - Horizontal', color: '#3B82F6' },
    { name: 'Split Wipe - Left', color: '#8B5CF6' },
    { name: 'Split Wipe - Diagonal', color: '#EC4899' },
    { name: 'Iris Wipe', color: '#F59E0B' },
    { name: 'Mask Reveal - Circle', color: '#10B981' },
    { name: 'Mask Reveal - Diamond', color: '#6366F1' },
    { name: 'Mask Reveal - Star', color: '#EF4444' },
    { name: 'Shutter Reveal', color: '#14B8A6' },
    { name: 'Liquid Morph', color: '#F97316' },
    { name: 'Blob Transition', color: '#8B5CF6' },
    { name: 'Wave Transition', color: '#06B6D4' },
    { name: 'Zoom Punch', color: '#84CC16' },
    { name: 'Cross Dissolve', color: '#A855F7' },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Base scene */}
      <ColorScene color="#1a1a1a" title="Transition Demo" subtitle="Watch the transitions!" />

      {/* Transition 1: Split Wipe Horizontal */}
      <Sequence from={SCENE_DURATION * 0} durationInFrames={SCENE_DURATION}>
        <SplitWipe direction="horizontal" durationInFrames={TRANSITION_DURATION}>
          <ColorScene color="#3B82F6" title="Split Wipe" subtitle="Horizontal" />
        </SplitWipe>
      </Sequence>

      {/* Transition 2: Split Wipe Left */}
      <Sequence from={SCENE_DURATION * 1} durationInFrames={SCENE_DURATION}>
        <SplitWipe direction="left" durationInFrames={TRANSITION_DURATION}>
          <ColorScene color="#8B5CF6" title="Split Wipe" subtitle="Left to Right" />
        </SplitWipe>
      </Sequence>

      {/* Transition 3: Split Wipe Diagonal */}
      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION}>
        <SplitWipe direction="diagonal" durationInFrames={TRANSITION_DURATION} wipeColor="#EC4899">
          <ColorScene color="#EC4899" title="Split Wipe" subtitle="Diagonal" />
        </SplitWipe>
      </Sequence>

      {/* Transition 4: Iris Wipe */}
      <Sequence from={SCENE_DURATION * 3} durationInFrames={SCENE_DURATION}>
        <IrisWipe durationInFrames={TRANSITION_DURATION} direction="in">
          <ColorScene color="#F59E0B" title="Iris Wipe" subtitle="Classic circular reveal" />
        </IrisWipe>
      </Sequence>

      {/* Transition 5: Mask Reveal Circle */}
      <Sequence from={SCENE_DURATION * 4} durationInFrames={SCENE_DURATION}>
        <MaskReveal shape="circle" durationInFrames={TRANSITION_DURATION} center={[0.3, 0.5]}>
          <ColorScene color="#10B981" title="Mask Reveal" subtitle="Circle from off-center" />
        </MaskReveal>
      </Sequence>

      {/* Transition 6: Mask Reveal Diamond */}
      <Sequence from={SCENE_DURATION * 5} durationInFrames={SCENE_DURATION}>
        <MaskReveal shape="diamond" durationInFrames={TRANSITION_DURATION}>
          <ColorScene color="#6366F1" title="Mask Reveal" subtitle="Diamond shape" />
        </MaskReveal>
      </Sequence>

      {/* Transition 7: Mask Reveal Star */}
      <Sequence from={SCENE_DURATION * 6} durationInFrames={SCENE_DURATION}>
        <MaskReveal shape="star" durationInFrames={TRANSITION_DURATION} rotation={180}>
          <ColorScene color="#EF4444" title="Mask Reveal" subtitle="Rotating star" />
        </MaskReveal>
      </Sequence>

      {/* Transition 8: Shutter Reveal */}
      <Sequence from={SCENE_DURATION * 7} durationInFrames={SCENE_DURATION}>
        <ShutterReveal durationInFrames={TRANSITION_DURATION} blades={12}>
          <ColorScene color="#14B8A6" title="Shutter Reveal" subtitle="Venetian blinds effect" />
        </ShutterReveal>
      </Sequence>

      {/* Transition 9: Liquid Morph */}
      <Sequence from={SCENE_DURATION * 8} durationInFrames={SCENE_DURATION}>
        <LiquidMorph durationInFrames={45} complexity={8} wobbleAmount={30}>
          <ColorScene color="#F97316" title="Liquid Morph" subtitle="Organic blob reveal" />
        </LiquidMorph>
      </Sequence>

      {/* Transition 10: Blob Transition */}
      <Sequence from={SCENE_DURATION * 9} durationInFrames={SCENE_DURATION}>
        <BlobTransition durationInFrames={40} origin={[0.7, 0.3]} color="#8B5CF6">
          <ColorScene color="#8B5CF6" title="Blob Transition" subtitle="Smooth expanding circle" />
        </BlobTransition>
      </Sequence>

      {/* Transition 11: Wave Transition */}
      <Sequence from={SCENE_DURATION * 10} durationInFrames={SCENE_DURATION}>
        <WaveTransition durationInFrames={35} waves={3} amplitude={60} direction="right">
          <ColorScene color="#06B6D4" title="Wave Transition" subtitle="Wavy edge reveal" />
        </WaveTransition>
      </Sequence>

      {/* Transition 12: Zoom Punch */}
      <Sequence from={SCENE_DURATION * 11} durationInFrames={SCENE_DURATION}>
        <ZoomPunch punchFrame={10} zoomAmount={1.2}>
          <ColorScene color="#84CC16" title="Zoom Punch" subtitle="Quick zoom impact" />
        </ZoomPunch>
      </Sequence>

      {/* Transition 13: Cross Dissolve */}
      <Sequence from={SCENE_DURATION * 12} durationInFrames={SCENE_DURATION}>
        <CrossDissolve durationInFrames={TRANSITION_DURATION}>
          <ColorScene color="#A855F7" title="Cross Dissolve" subtitle="Classic fade" />
        </CrossDissolve>
      </Sequence>

      {/* Multi Zoom Punch Demo */}
      <Sequence from={SCENE_DURATION * 13} durationInFrames={SCENE_DURATION * 2}>
        <MultiZoomPunch punchFrames={[10, 40, 70, 100, 130]} zoomAmount={1.08}>
          <ColorScene
            color="#FF7050"
            title="Multi Zoom Punch"
            subtitle="Multiple beat-synced punches"
          />
        </MultiZoomPunch>
      </Sequence>
    </AbsoluteFill>
  );
};
