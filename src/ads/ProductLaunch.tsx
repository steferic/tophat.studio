import React from 'react';
import { loadFont } from '@remotion/google-fonts/Inter';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { ParticleField, ScaleIn, AnimatedText, GlowPulse } from '../components/animations';
import { Button, Logo } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// Product Launch Ad - 15 seconds @ 60fps = 900 frames
// Scenes: Teaser (180f) -> Reveal (240f) -> Features (300f) -> CTA (180f)

interface ProductLaunchProps {
  productName?: string;
  tagline?: string;
  features?: string[];
  ctaText?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Dramatic countdown component
const Countdown: React.FC<{ number: number; delay: number }> = ({ number, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 8, stiffness: 80 },
    durationInFrames: 40,
  });

  const scale = interpolate(progress, [0, 0.5, 1], [3, 1.2, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < delay) return null;

  return (
    <div
      style={{
        fontSize: 200,
        fontWeight: 900,
        fontFamily,
        color: '#ffffff',
        transform: `scale(${scale})`,
        opacity,
        textShadow: '0 0 60px rgba(99, 102, 241, 0.8)',
      }}
    >
      {number}
    </div>
  );
};

// Product reveal with glow effect
const ProductReveal: React.FC<{
  productName: string;
  primaryColor: string;
}> = ({ productName, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const revealProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 50 },
    durationInFrames: 80,
  });

  const glowIntensity = interpolate(
    frame,
    [0, 60, 120],
    [0, 80, 40],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
      }}
    >
      {/* Product "device" mockup */}
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 40,
          background: `linear-gradient(135deg, ${primaryColor}, #1a1a2e)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${revealProgress}) rotateY(${interpolate(revealProgress, [0, 1], [90, 0])}deg)`,
          boxShadow: `0 0 ${glowIntensity}px ${primaryColor}`,
          perspective: 1000,
        }}
      >
        <div
          style={{
            fontSize: 100,
            opacity: revealProgress,
          }}
        >
          ⚡
        </div>
      </div>

      {/* Product name */}
      <ScaleIn delay={40} duration={50}>
        <GlowPulse color={primaryColor} intensity={30}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              fontFamily,
              color: '#ffffff',
              letterSpacing: -2,
            }}
          >
            {productName}
          </div>
        </GlowPulse>
      </ScaleIn>
    </div>
  );
};

// Feature showcase
const FeatureShowcase: React.FC<{
  features: string[];
  primaryColor: string;
}> = ({ features, primaryColor }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          fontFamily,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 20,
        }}
      >
        Introducing
      </div>
      {features.map((feature, index) => (
        <ScaleIn key={feature} delay={index * 40} duration={40}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '16px 32px',
              borderRadius: 50,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: primaryColor,
                boxShadow: `0 0 20px ${primaryColor}`,
              }}
            />
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                fontFamily,
                color: '#ffffff',
              }}
            >
              {feature}
            </span>
          </div>
        </ScaleIn>
      ))}
    </div>
  );
};

// CTA Scene
const CTAScene: React.FC<{
  tagline: string;
  ctaText: string;
  primaryColor: string;
}> = ({ tagline, ctaText, primaryColor }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <AnimatedText
        text={tagline}
        type="wave"
        fontSize={48}
        fontWeight={700}
        color="#ffffff"
        staggerDelay={2}
      />
      <ScaleIn delay={60} duration={40}>
        <Button
          text={ctaText}
          backgroundColor={primaryColor}
          textColor="#ffffff"
          fontSize={24}
          padding="20px 48px"
          borderRadius={50}
          pulse
          pulseSpeed={40}
        />
      </ScaleIn>
      <ScaleIn delay={100} duration={40}>
        <Logo text="TechCorp" icon="⚡" color="rgba(255,255,255,0.6)" fontSize={24} animated={false} />
      </ScaleIn>
    </div>
  );
};

export const ProductLaunch: React.FC<ProductLaunchProps> = ({
  productName = 'NOVA X1',
  tagline = 'The Future is Here',
  features = ['10x Faster', 'AI Powered', 'Ultra Lightweight'],
  ctaText = 'Pre-Order Now',
  primaryColor = '#6366f1',
  secondaryColor = '#0f0f23',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Background */}
      <GradientBackground colors={[secondaryColor, '#1a1a2e', secondaryColor]}>
        <ParticleField
          count={80}
          color={primaryColor}
          minSize={1}
          maxSize={4}
          speed={0.5}
          fadeIn
          fadeInDuration={120}
        />
      </GradientBackground>

      {/* Scene 1: Countdown Teaser (0-180 frames) */}
      <Sequence from={0} durationInFrames={180}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Countdown number={3} delay={0} />
          <Countdown number={2} delay={50} />
          <Countdown number={1} delay={100} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Product Reveal (180-420 frames) */}
      <Sequence from={180} durationInFrames={240}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ProductReveal productName={productName} primaryColor={primaryColor} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Features (420-720 frames) */}
      <Sequence from={420} durationInFrames={300}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FeatureShowcase features={features} primaryColor={primaryColor} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: CTA (720-900 frames) */}
      <Sequence from={720} durationInFrames={180}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CTAScene
            tagline={tagline}
            ctaText={ctaText}
            primaryColor={primaryColor}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
