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
import { FadeIn, SlideIn, ScaleIn, AnimatedText } from '../components/animations';
import { PhoneMockup, Badge } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// Mobile App Promo Ad - 15 seconds @ 60fps = 900 frames
// Scenes: Hook (120f) -> Phone Intro (180f) -> Feature Walkthrough (300f) -> Social Proof (150f) -> CTA (150f)

interface MobileAppPromoProps {
  appName?: string;
  tagline?: string;
  features?: { icon: string; title: string; description: string }[];
  rating?: number;
  downloads?: string;
  ctaText?: string;
  primaryColor?: string;
}

// Hook scene
const HookScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <AnimatedText
        text={tagline}
        type="blur"
        fontSize={52}
        fontWeight={700}
        color="#ffffff"
        staggerDelay={3}
      />
    </AbsoluteFill>
  );
};

// Phone intro scene
const PhoneIntroScene: React.FC<{
  appName: string;
  primaryColor: string;
}> = ({ appName, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 60 },
    durationInFrames: 80,
  });

  // App screen content
  const AppScreen = () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, ${primaryColor}, ${primaryColor}88)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ fontSize: 50, marginBottom: 10 }}>📱</div>
      <div
        style={{
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 700,
          fontFamily,
          textAlign: 'center',
        }}
      >
        {appName}
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 10,
          fontFamily,
          marginTop: 5,
        }}
      >
        Welcome back!
      </div>

      {/* Mock UI elements */}
      <div
        style={{
          width: '80%',
          marginTop: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 8,
              height: 40,
              width: '100%',
            }}
          />
        ))}
      </div>
    </div>
  );

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
          alignItems: 'center',
          gap: 60,
        }}
      >
        <div
          style={{
            transform: `translateY(${interpolate(phoneProgress, [0, 1], [100, 0])}px)`,
            opacity: phoneProgress,
          }}
        >
          <PhoneMockup width={240}>
            <AppScreen />
          </PhoneMockup>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <SlideIn direction="right" delay={60} duration={50}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                fontFamily,
                color: '#ffffff',
              }}
            >
              {appName}
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={90} duration={50}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 400,
                fontFamily,
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 400,
              }}
            >
              The all-in-one app that simplifies your daily life
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={120} duration={50}>
            <Badge
              text="New Release"
              backgroundColor={primaryColor}
              fontSize={12}
            />
          </SlideIn>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Feature walkthrough scene
const FeatureScene: React.FC<{
  features: { icon: string; title: string; description: string }[];
  primaryColor: string;
}> = ({ features, primaryColor }) => {
  const frame = useCurrentFrame();
  const featureIndex = Math.min(
    Math.floor(frame / 100),
    features.length - 1
  );

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
          alignItems: 'center',
          gap: 80,
        }}
      >
        {/* Feature indicators */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {features.map((_, index) => (
            <div
              key={index}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor:
                  index === featureIndex ? primaryColor : 'rgba(255,255,255,0.3)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>

        {/* Current feature */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            maxWidth: 500,
          }}
        >
          {features.map((feature, index) => {
            const isActive = index === featureIndex;
            const localFrame = frame - index * 100;

            if (!isActive && localFrame < 0) return null;
            if (!isActive && localFrame > 100) return null;

            const opacity = isActive
              ? interpolate(localFrame, [0, 30], [0, 1], {
                  extrapolateRight: 'clamp',
                })
              : interpolate(localFrame, [70, 100], [1, 0], {
                  extrapolateLeft: 'clamp',
                });

            const translateY = isActive
              ? interpolate(localFrame, [0, 30], [30, 0], {
                  extrapolateRight: 'clamp',
                })
              : 0;

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 24,
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 80,
                    backgroundColor: `${primaryColor}22`,
                    borderRadius: 24,
                    padding: 24,
                  }}
                >
                  {feature.icon}
                </div>

                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily,
                    color: '#ffffff',
                    textAlign: 'center',
                  }}
                >
                  {feature.title}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    fontFamily,
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Social proof scene
const SocialProofScene: React.FC<{
  rating: number;
  downloads: string;
  primaryColor: string;
}> = ({ rating, downloads, primaryColor }) => {
  // Animated stars
  const stars = Array(5).fill(0).map((_, i) => {
    const isFilled = i < Math.floor(rating);
    const delay = i * 16;

    return (
      <ScaleIn key={i} delay={delay} duration={30}>
        <span
          style={{
            fontSize: 40,
            color: isFilled ? '#fbbf24' : 'rgba(255,255,255,0.3)',
          }}
        >
          ★
        </span>
      </ScaleIn>
    );
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
        {/* Rating */}
        <FadeIn delay={0} duration={40}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              fontFamily,
              color: '#ffffff',
            }}
          >
            {rating.toFixed(1)}
          </div>
        </FadeIn>

        <div style={{ display: 'flex', gap: 8 }}>{stars}</div>

        <SlideIn direction="bottom" delay={100} duration={40}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              marginTop: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily,
                  color: primaryColor,
                }}
              >
                {downloads}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Downloads
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 40,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily,
                  color: primaryColor,
                }}
              >
                50K+
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Reviews
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// CTA scene with app store buttons
const CTAScene: React.FC<{
  appName: string;
  ctaText: string;
}> = ({ appName, ctaText }) => {
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
        <AnimatedText
          text={ctaText}
          type="stagger"
          fontSize={42}
          fontWeight={700}
          color="#ffffff"
          staggerDelay={2}
        />

        {/* App Store buttons */}
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          <SlideIn direction="left" delay={60} duration={40}>
            <div
              style={{
                backgroundColor: '#000000',
                borderRadius: 12,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: 28 }}>🍎</span>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Download on the
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily,
                    color: '#ffffff',
                  }}
                >
                  App Store
                </div>
              </div>
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={60} duration={40}>
            <div
              style={{
                backgroundColor: '#000000',
                borderRadius: 12,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: 28 }}>▶️</span>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Get it on
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily,
                    color: '#ffffff',
                  }}
                >
                  Google Play
                </div>
              </div>
            </div>
          </SlideIn>
        </div>

        <FadeIn delay={100} duration={40}>
          <div
            style={{
              fontSize: 16,
              fontFamily,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {appName} • Free to download
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const MobileAppPromo: React.FC<MobileAppPromoProps> = ({
  appName = 'Taskly',
  tagline = 'Your productivity, simplified',
  features = [
    {
      icon: '📋',
      title: 'Smart Task Management',
      description: 'Organize your tasks with AI-powered suggestions',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Visualize your productivity with beautiful charts',
    },
    {
      icon: '🔔',
      title: 'Smart Reminders',
      description: 'Never miss a deadline with intelligent notifications',
    },
  ],
  rating = 4.8,
  downloads = '2M+',
  ctaText = 'Download Free Today',
  primaryColor = '#8b5cf6',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#1a1a2e', '#16213e', '#1a1a2e']}>
        {/* Scene 1: Hook (0-120 frames) */}
        <Sequence from={0} durationInFrames={120}>
          <HookScene tagline={tagline} />
        </Sequence>

        {/* Scene 2: Phone Intro (120-300 frames) */}
        <Sequence from={120} durationInFrames={180}>
          <PhoneIntroScene appName={appName} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 3: Feature Walkthrough (300-600 frames) */}
        <Sequence from={300} durationInFrames={300}>
          <FeatureScene features={features} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 4: Social Proof (600-750 frames) */}
        <Sequence from={600} durationInFrames={150}>
          <SocialProofScene
            rating={rating}
            downloads={downloads}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 5: CTA (750-900 frames) */}
        <Sequence from={750} durationInFrames={150}>
          <CTAScene appName={appName} ctaText={ctaText} />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
