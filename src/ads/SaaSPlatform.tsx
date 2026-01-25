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
import { SlideIn, FadeIn, CountUp, AnimatedText } from '../components/animations';
import { BrowserMockup, StatCard, TestimonialCard, Button, Logo } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// SaaS Platform Ad - 20 seconds @ 60fps = 1200 frames
// Scenes: Problem (180f) -> Solution Intro (180f) -> Dashboard Demo (300f) -> Stats (240f) -> Testimonial (180f) -> CTA (120f)

interface SaaSPlatformProps {
  companyName?: string;
  tagline?: string;
  problemStatement?: string;
  stats?: { value: string; label: string }[];
  testimonial?: { quote: string; author: string; role: string };
  ctaText?: string;
  primaryColor?: string;
}

// Problem statement scene
const ProblemScene: React.FC<{ problemStatement: string }> = ({ problemStatement }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <SlideIn direction="bottom" delay={20} duration={60}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            fontFamily,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 20,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          The Problem
        </div>
      </SlideIn>
      <FadeIn delay={60} duration={80}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            fontFamily,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          {problemStatement}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Solution intro scene
const SolutionScene: React.FC<{
  companyName: string;
  tagline: string;
  primaryColor: string;
}> = ({ companyName, tagline, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
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
        <div
          style={{
            transform: `scale(${logoProgress})`,
            opacity: logoProgress,
          }}
        >
          <Logo
            text={companyName}
            icon="◆"
            color={primaryColor}
            fontSize={64}
            animated={false}
          />
        </div>
        <SlideIn direction="bottom" delay={60} duration={50}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              fontFamily,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
            }}
          >
            {tagline}
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// Dashboard demo scene with browser mockup
const DashboardScene: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 60 },
    durationInFrames: 80,
  });

  // Animated dashboard content
  const DashboardContent = () => {
    const chartHeight = interpolate(frame, [60, 160], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          padding: 20,
          display: 'flex',
          gap: 20,
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 180,
            backgroundColor: '#1e293b',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              fontFamily,
              marginBottom: 24,
            }}
          >
            Dashboard
          </div>
          {['Overview', 'Analytics', 'Reports', 'Settings'].map((item, i) => (
            <SlideIn key={item} direction="left" delay={80 + i * 20} distance={30}>
              <div
                style={{
                  color: i === 0 ? primaryColor : 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  fontFamily,
                  padding: '10px 12px',
                  borderRadius: 6,
                  backgroundColor: i === 0 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  marginBottom: 4,
                }}
              >
                {item}
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Revenue', value: '$48.2K', change: '+12%' },
              { label: 'Users', value: '2,847', change: '+8%' },
              { label: 'Conversion', value: '3.2%', change: '+2%' },
            ].map((stat, i) => (
              <SlideIn key={stat.label} direction="top" delay={120 + i * 30} distance={20}>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily, marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily, color: '#0f172a' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#22c55e', fontFamily }}>{stat.change}</div>
                </div>
              </SlideIn>
            ))}
          </div>

          {/* Chart area */}
          <FadeIn delay={180} duration={60}>
            <div
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily, color: '#0f172a', marginBottom: 16 }}>
                Revenue Overview
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${(h * chartHeight) / 100}%`,
                      backgroundColor: i === 11 ? primaryColor : '#e2e8f0',
                      borderRadius: 4,
                    }}
                  />
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${interpolate(browserProgress, [0, 1], [0.8, 1])})`,
        opacity: browserProgress,
      }}
    >
      <BrowserMockup url="https://app.analytica.io/dashboard" width={900} height={500}>
        <DashboardContent />
      </BrowserMockup>
    </AbsoluteFill>
  );
};

// Stats scene
const StatsScene: React.FC<{
  stats: { value: string; label: string }[];
}> = ({ stats }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SlideIn direction="top" delay={0} duration={50}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            fontFamily,
            color: '#ffffff',
            marginBottom: 50,
            textAlign: 'center',
          }}
        >
          Trusted by thousands
        </div>
      </SlideIn>
      <div style={{ display: 'flex', gap: 30 }}>
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delay={40 + index * 30}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Testimonial scene
const TestimonialScene: React.FC<{
  testimonial: { quote: string; author: string; role: string };
  primaryColor: string;
}> = ({ testimonial, primaryColor }) => {
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <TestimonialCard
        quote={testimonial.quote}
        author={testimonial.author}
        role={testimonial.role}
        delay={20}
        accentColor={primaryColor}
        style={{ maxWidth: 700 }}
      />
    </AbsoluteFill>
  );
};

// CTA scene
const CTASceneSaaS: React.FC<{
  ctaText: string;
  primaryColor: string;
}> = ({ ctaText, primaryColor }) => {
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
          text="Start your free trial"
          type="stagger"
          fontSize={42}
          fontWeight={700}
          color="#ffffff"
          staggerDelay={2}
        />
        <FadeIn delay={60} duration={40}>
          <Button
            text={ctaText}
            backgroundColor={primaryColor}
            textColor="#ffffff"
            fontSize={20}
            padding="18px 40px"
            borderRadius={8}
            pulse
          />
        </FadeIn>
        <FadeIn delay={90} duration={40}>
          <div
            style={{
              fontSize: 14,
              fontFamily,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            No credit card required • 14-day free trial
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const SaaSPlatform: React.FC<SaaSPlatformProps> = ({
  companyName = 'Analytica',
  tagline = 'Analytics that actually make sense',
  problemStatement = 'Spending hours trying to understand your data?',
  stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '50M+', label: 'Data Points' },
  ],
  testimonial = {
    quote: "Analytica transformed how we understand our customers. We've increased retention by 40% in just 3 months.",
    author: 'Sarah Chen',
    role: 'VP of Product, TechStartup',
  },
  ctaText = 'Get Started Free',
  primaryColor = '#6366f1',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#0f172a', '#1e293b', '#0f172a']}>
        {/* Scene 1: Problem (0-180 frames) */}
        <Sequence from={0} durationInFrames={180}>
          <ProblemScene problemStatement={problemStatement} />
        </Sequence>

        {/* Scene 2: Solution Intro (180-360 frames) */}
        <Sequence from={180} durationInFrames={180}>
          <SolutionScene
            companyName={companyName}
            tagline={tagline}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 3: Dashboard Demo (360-660 frames) */}
        <Sequence from={360} durationInFrames={300}>
          <DashboardScene primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 4: Stats (660-900 frames) */}
        <Sequence from={660} durationInFrames={240}>
          <StatsScene stats={stats} />
        </Sequence>

        {/* Scene 5: Testimonial (900-1080 frames) */}
        <Sequence from={900} durationInFrames={180}>
          <TestimonialScene testimonial={testimonial} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 6: CTA (1080-1200 frames) */}
        <Sequence from={1080} durationInFrames={120}>
          <CTASceneSaaS ctaText={ctaText} primaryColor={primaryColor} />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
