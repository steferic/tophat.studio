import React from 'react';
import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadSerif } from '@remotion/google-fonts/Playfair';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { FadeIn, SlideIn, AnimatedText, ScaleIn } from '../components/animations';
import { Logo, Button } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();
const { fontFamily: serifFont } = loadSerif();

// Startup Brand Story Ad - 25 seconds @ 60fps = 1500 frames
// Scenes: Hook (180f) -> Origin (240f) -> Mission (240f) -> Timeline (360f) -> Vision (240f) -> CTA (240f)

interface StartupStoryProps {
  companyName?: string;
  foundedYear?: string;
  hook?: string;
  mission?: string;
  vision?: string;
  milestones?: { year: string; event: string }[];
  ctaText?: string;
  primaryColor?: string;
  accentColor?: string;
}

// Emotional hook scene
const HookScene: React.FC<{ hook: string }> = ({ hook }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 100,
      }}
    >
      <FadeIn delay={40} duration={100}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 400,
            fontFamily: serifFont,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}
        >
          "{hook}"
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Origin story scene
const OriginScene: React.FC<{
  companyName: string;
  foundedYear: string;
  primaryColor: string;
}> = ({ companyName, foundedYear, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 60,
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <FadeIn delay={0} duration={60}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              fontFamily,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            Est. {foundedYear}
          </div>
        </FadeIn>

        <div
          style={{
            transform: `scale(${logoProgress})`,
            opacity: logoProgress,
          }}
        >
          <Logo
            text={companyName}
            color={primaryColor}
            fontSize={72}
            fontWeight={800}
            animated={false}
          />
        </div>

        <SlideIn direction="bottom" delay={80} duration={50}>
          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: primaryColor,
              borderRadius: 2,
            }}
          />
        </SlideIn>

        <FadeIn delay={120} duration={60}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              fontFamily,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
            }}
          >
            A story of passion and purpose
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Mission scene
const MissionScene: React.FC<{
  mission: string;
  primaryColor: string;
}> = ({ mission, primaryColor }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <SlideIn direction="top" delay={0} duration={50}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily,
              color: primaryColor,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Our Mission
          </div>
        </SlideIn>

        <FadeIn delay={40} duration={80}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 600,
              fontFamily,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            {mission}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Timeline scene
const TimelineScene: React.FC<{
  milestones: { year: string; event: string }[];
  primaryColor: string;
}> = ({ milestones, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '80%',
          maxWidth: 800,
        }}
      >
        <FadeIn delay={0} duration={40}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily,
              color: primaryColor,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            Our Journey
          </div>
        </FadeIn>

        {milestones.map((milestone, index) => {
          const itemDelay = 60 + index * 70;
          const progress = spring({
            frame: frame - itemDelay,
            fps,
            config: { damping: 15, stiffness: 100 },
            durationInFrames: 50,
          });

          const lineProgress = spring({
            frame: frame - itemDelay - 20,
            fps,
            config: { damping: 20, stiffness: 80 },
            durationInFrames: 40,
          });

          return (
            <div
              key={milestone.year}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                opacity: progress,
                transform: `translateX(${interpolate(progress, [0, 1], [-30, 0])}px)`,
              }}
            >
              {/* Year */}
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  fontFamily,
                  color: primaryColor,
                  minWidth: 100,
                }}
              >
                {milestone.year}
              </div>

              {/* Line */}
              <div
                style={{
                  width: 60,
                  height: 3,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${lineProgress * 100}%`,
                    height: '100%',
                    backgroundColor: primaryColor,
                  }}
                />
              </div>

              {/* Event */}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  fontFamily,
                  color: '#ffffff',
                  flex: 1,
                }}
              >
                {milestone.event}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Vision scene
const VisionScene: React.FC<{
  vision: string;
  accentColor: string;
}> = ({ vision, accentColor }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <ScaleIn delay={0} duration={60}>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1,
            }}
          >
            🚀
          </div>
        </ScaleIn>

        <FadeIn delay={40} duration={80}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: 800,
            }}
          >
            {vision}
          </div>
        </FadeIn>

        <SlideIn direction="bottom" delay={100} duration={50}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              fontFamily,
              color: accentColor,
            }}
          >
            The future we're building together
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// CTA scene
const CTAScene: React.FC<{
  companyName: string;
  ctaText: string;
  primaryColor: string;
}> = ({ companyName, ctaText, primaryColor }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <AnimatedText
          text="Join Our Story"
          type="wave"
          fontSize={52}
          fontWeight={700}
          color="#ffffff"
          staggerDelay={3}
        />

        <FadeIn delay={80} duration={50}>
          <Button
            text={ctaText}
            backgroundColor={primaryColor}
            textColor="#ffffff"
            fontSize={20}
            padding="18px 48px"
            borderRadius={50}
            pulse
            pulseSpeed={50}
          />
        </FadeIn>

        <FadeIn delay={120} duration={50}>
          <Logo
            text={companyName}
            color="rgba(255,255,255,0.5)"
            fontSize={24}
            animated={false}
          />
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const StartupStory: React.FC<StartupStoryProps> = ({
  companyName = 'Lumina',
  foundedYear = '2019',
  hook = "What if technology could truly understand us?",
  mission = "To create technology that amplifies human potential and brings people closer together.",
  vision = "A world where everyone has access to tools that help them thrive.",
  milestones = [
    { year: '2019', event: 'Founded in a small garage' },
    { year: '2020', event: 'First 1,000 users' },
    { year: '2022', event: '$10M Series A' },
    { year: '2024', event: '1 million users worldwide' },
  ],
  ctaText = 'Learn More',
  primaryColor = '#f59e0b',
  accentColor = '#fbbf24',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}>
        {/* Scene 1: Hook (0-180 frames) */}
        <Sequence from={0} durationInFrames={180}>
          <HookScene hook={hook} />
        </Sequence>

        {/* Scene 2: Origin (180-420 frames) */}
        <Sequence from={180} durationInFrames={240}>
          <OriginScene
            companyName={companyName}
            foundedYear={foundedYear}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 3: Mission (420-660 frames) */}
        <Sequence from={420} durationInFrames={240}>
          <MissionScene mission={mission} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 4: Timeline (660-1020 frames) */}
        <Sequence from={660} durationInFrames={360}>
          <TimelineScene milestones={milestones} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 5: Vision (1020-1260 frames) */}
        <Sequence from={1020} durationInFrames={240}>
          <VisionScene vision={vision} accentColor={accentColor} />
        </Sequence>

        {/* Scene 6: CTA (1260-1500 frames) */}
        <Sequence from={1260} durationInFrames={240}>
          <CTAScene
            companyName={companyName}
            ctaText={ctaText}
            primaryColor={primaryColor}
          />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
