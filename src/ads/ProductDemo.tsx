import React from 'react';
import { loadFont } from '@remotion/google-fonts/Inter';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from 'remotion';
import { FadeIn, SlideIn, ScaleIn, AnimatedText } from '../components/animations';
import { BrowserWithScroll } from '../components/ui/BrowserWithScroll';
import { Button, Badge } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// Product Demo Ad - 20 seconds @ 60fps = 1200 frames
// Scenes: Hook (120f) -> Browser Demo (480f) -> Features Overlay (300f) -> CTA (300f)

interface ProductDemoProps {
  /** Path to the full-page screenshot (relative to public folder) */
  screenshotPath?: string;
  /** Product/company name */
  productName?: string;
  /** Product website URL to show in browser */
  productUrl?: string;
  /** Tagline */
  tagline?: string;
  /** Key features to highlight */
  features?: string[];
  /** Call to action text */
  ctaText?: string;
  /** Primary brand color */
  primaryColor?: string;
  /** Secondary/accent color */
  accentColor?: string;
}

// Hook scene - attention grabber
const HookScene: React.FC<{
  productName: string;
  tagline: string;
  primaryColor: string;
}> = ({ productName, tagline, primaryColor }) => {
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
          gap: 24,
        }}
      >
        <ScaleIn delay={0} duration={40}>
          <Badge
            text="Introducing"
            backgroundColor={primaryColor}
            fontSize={14}
          />
        </ScaleIn>

        <AnimatedText
          text={productName}
          type="wave"
          fontSize={72}
          fontWeight={800}
          color="#ffffff"
          delay={30}
          staggerDelay={6}
        />

        <FadeIn delay={80} duration={50}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              fontFamily,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              maxWidth: 600,
            }}
          >
            {tagline}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Browser demo scene with scrolling screenshot
const BrowserDemoScene: React.FC<{
  screenshotPath: string;
  productUrl: string;
  primaryColor: string;
}> = ({ screenshotPath, productUrl, primaryColor }) => {
  const frame = useCurrentFrame();

  // Subtle floating animation for the browser - use rounded values to prevent subpixel issues
  const float = Math.round(Math.sin(frame * 0.03) * 5);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          // Use translate3d for GPU acceleration
          transform: `translate3d(0, ${float}px, 0)`,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <BrowserWithScroll
          src={staticFile(screenshotPath)}
          url={productUrl}
          width={1000}
          height={600}
          scrollDelay={80}
          scrollDuration={360}
          scrollAmount={0.5}
          animateEntrance
          entranceDelay={0}
        />
      </div>
    </AbsoluteFill>
  );
};

// Features overlay scene - browser shrinks, features appear
const FeaturesScene: React.FC<{
  screenshotPath: string;
  productUrl: string;
  features: string[];
  primaryColor: string;
}> = ({ screenshotPath, productUrl, features, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser shrinks and moves to the left
  const shrinkProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 60,
  });

  const browserScale = interpolate(shrinkProgress, [0, 1], [1, 0.65], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const browserX = interpolate(shrinkProgress, [0, 1], [0, -200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Shrunk browser on the left */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          // Use translate3d for GPU acceleration
          transform: `translate3d(calc(-50% + ${browserX}px), -50%, 0) scale(${browserScale})`,
          transformOrigin: 'center center',
          // GPU acceleration hints
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <BrowserWithScroll
          src={staticFile(screenshotPath)}
          url={productUrl}
          width={1000}
          height={600}
          scrollDelay={0}
          scrollDuration={1}
          scrollAmount={0.25}
          animateEntrance={false}
        />
      </div>

      {/* Features list on the right */}
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 400,
        }}
      >
        <SlideIn direction="right" delay={60} duration={40}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily,
              color: primaryColor,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Key Features
          </div>
        </SlideIn>

        {features.map((feature, index) => (
          <SlideIn
            key={feature}
            direction="right"
            delay={90 + index * 40}
            duration={40}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '16px 20px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  fontFamily,
                  color: '#ffffff',
                  lineHeight: 1.4,
                }}
              >
                {feature}
              </span>
            </div>
          </SlideIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// CTA scene
const CTAScene: React.FC<{
  productName: string;
  ctaText: string;
  primaryColor: string;
}> = ({ productName, ctaText, primaryColor }) => {
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
          text={`Try ${productName} Today`}
          type="stagger"
          fontSize={52}
          fontWeight={700}
          color="#ffffff"
          staggerDelay={2}
        />

        <FadeIn delay={80} duration={50}>
          <div
            style={{
              fontSize: 20,
              fontFamily,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 10,
            }}
          >
            Join thousands of happy users
          </div>
        </FadeIn>

        <ScaleIn delay={100} duration={40}>
          <Button
            text={ctaText}
            backgroundColor={primaryColor}
            textColor="#ffffff"
            fontSize={22}
            padding="20px 50px"
            borderRadius={50}
            pulse
            pulseSpeed={40}
          />
        </ScaleIn>

        <FadeIn delay={140} duration={50}>
          <div
            style={{
              display: 'flex',
              gap: 30,
              marginTop: 20,
            }}
          >
            {['No credit card required', 'Free 14-day trial', 'Cancel anytime'].map(
              (text, i) => (
                <div
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontFamily,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <span style={{ color: '#22c55e' }}>✓</span>
                  {text}
                </div>
              )
            )}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const ProductDemo: React.FC<ProductDemoProps> = ({
  screenshotPath = 'screenshots/linear.png',
  productName = 'Linear',
  productUrl = 'https://linear.app',
  tagline = 'The issue tracking tool you\'ll enjoy using',
  features = [
    'Lightning-fast performance',
    'Beautiful, intuitive interface',
    'Powerful keyboard shortcuts',
    'Seamless Git integration',
  ],
  ctaText = 'Start Free Trial',
  primaryColor = '#5E6AD2',
  accentColor = '#8B5CF6',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}>
        {/* Scene 1: Hook (0-120 frames) */}
        <Sequence from={0} durationInFrames={120}>
          <HookScene
            productName={productName}
            tagline={tagline}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 2: Browser Demo with Scroll (120-600 frames) */}
        <Sequence from={120} durationInFrames={480}>
          <BrowserDemoScene
            screenshotPath={screenshotPath}
            productUrl={productUrl}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 3: Features Overlay (600-900 frames) */}
        <Sequence from={600} durationInFrames={300}>
          <FeaturesScene
            screenshotPath={screenshotPath}
            productUrl={productUrl}
            features={features}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 4: CTA (900-1200 frames) */}
        <Sequence from={900} durationInFrames={300}>
          <CTAScene
            productName={productName}
            ctaText={ctaText}
            primaryColor={primaryColor}
          />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
