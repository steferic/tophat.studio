import React from 'react';
import { loadFont } from '@remotion/google-fonts/Inter';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
} from 'remotion';
import { FadeIn, SlideIn, ScaleIn, CountUp, AnimatedText } from '../components/animations';
import { Card, Button } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// Corporate/Enterprise Ad - 20 seconds @ 60fps = 1200 frames
// Scenes: Brand Statement (180f) -> Problem/Solution (240f) -> Data Visualization (240f) -> Global Reach (240f) -> Trust Badges (180f) -> CTA (120f)

interface CorporateEnterpriseProps {
  companyName?: string;
  tagline?: string;
  stats?: { value: number; suffix: string; label: string }[];
  clients?: string[];
  globalLocations?: number;
  ctaText?: string;
  primaryColor?: string;
}

// Brand statement scene - clean and authoritative
const BrandStatementScene: React.FC<{
  companyName: string;
  tagline: string;
  primaryColor: string;
}> = ({ companyName, tagline, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
    durationInFrames: 80,
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
        {/* Minimalist logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: logoProgress,
            transform: `translateY(${interpolate(logoProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              backgroundColor: primaryColor,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                backgroundColor: '#ffffff',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily,
              color: '#ffffff',
              letterSpacing: -1,
            }}
          >
            {companyName}
          </span>
        </div>

        {/* Divider line */}
        <SlideIn direction="left" delay={60} distance={200}>
          <div
            style={{
              width: 100,
              height: 2,
              backgroundColor: primaryColor,
            }}
          />
        </SlideIn>

        {/* Tagline */}
        <FadeIn delay={90} duration={60}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              fontFamily,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {tagline}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Problem/Solution scene
const ProblemSolutionScene: React.FC<{ primaryColor: string }> = ({
  primaryColor,
}) => {
  const frame = useCurrentFrame();

  const problems = [
    'Complex workflows',
    'Data silos',
    'Compliance risks',
  ];

  const solutions = [
    'Unified platform',
    'Real-time insights',
    'Built-in compliance',
  ];

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 100, alignItems: 'center' }}>
        {/* Problems column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <FadeIn delay={0} duration={40}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily,
                color: '#ef4444',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Challenges
            </div>
          </FadeIn>
          {problems.map((problem, index) => (
            <SlideIn
              key={problem}
              direction="left"
              delay={30 + index * 30}
              duration={40}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    fontSize: 20,
                    fontFamily,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {problem}
                </span>
              </div>
            </SlideIn>
          ))}
        </div>

        {/* Arrow */}
        <FadeIn delay={120} duration={40}>
          <div
            style={{
              fontSize: 40,
              color: primaryColor,
            }}
          >
            →
          </div>
        </FadeIn>

        {/* Solutions column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <FadeIn delay={140} duration={40}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily,
                color: '#22c55e',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Solutions
            </div>
          </FadeIn>
          {solutions.map((solution, index) => (
            <SlideIn
              key={solution}
              direction="right"
              delay={160 + index * 30}
              duration={40}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    fontSize: 20,
                    fontFamily,
                    color: '#ffffff',
                    fontWeight: 500,
                  }}
                >
                  {solution}
                </span>
              </div>
            </SlideIn>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Data visualization scene with animated charts
const DataVizScene: React.FC<{
  stats: { value: number; suffix: string; label: string }[];
  primaryColor: string;
}> = ({ stats, primaryColor }) => {
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
          alignItems: 'center',
          gap: 50,
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
            }}
          >
            Proven Results
          </div>
        </FadeIn>

        <div style={{ display: 'flex', gap: 60 }}>
          {stats.map((stat, index) => (
            <ScaleIn key={stat.label} delay={40 + index * 40} duration={50}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  padding: '30px 40px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <CountUp
                    to={stat.value}
                    delay={60 + index * 40}
                    duration={80}
                    fontSize={56}
                    fontWeight={800}
                    color="#ffffff"
                  />
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      fontFamily,
                      color: primaryColor,
                    }}
                  >
                    {stat.suffix}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily,
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Global reach scene with animated map dots
const GlobalReachScene: React.FC<{
  globalLocations: number;
  primaryColor: string;
}> = ({ globalLocations, primaryColor }) => {
  const frame = useCurrentFrame();

  // Generate random dot positions representing global offices
  const dots = Array(globalLocations)
    .fill(0)
    .map((_, i) => ({
      x: 15 + random(`x-${i}`) * 70,
      y: 20 + random(`y-${i}`) * 60,
      delay: random(`delay-${i}`) * 80,
      size: 6 + random(`size-${i}`) * 6,
    }));

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
        <FadeIn delay={0} duration={40}>
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
            Global Presence
          </div>
        </FadeIn>

        {/* Stylized world map */}
        <div
          style={{
            width: 800,
            height: 400,
            position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Grid lines */}
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${(i + 1) * 12.5}%`,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              />
            ))}
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <div
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${(i + 1) * 10}%`,
                  width: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              />
            ))}

          {/* Location dots */}
          {dots.map((dot, i) => {
            const dotProgress = spring({
              frame: frame - dot.delay,
              fps: 60,
              config: { damping: 15, stiffness: 100 },
              durationInFrames: 40,
            });

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                  transform: `scale(${dotProgress})`,
                  boxShadow: `0 0 ${dot.size * 2}px ${primaryColor}`,
                }}
              />
            );
          })}
        </div>

        <SlideIn direction="bottom" delay={120} duration={40}>
          <div
            style={{
              fontSize: 24,
              fontFamily,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {globalLocations}+ locations
            </span>{' '}
            across 6 continents
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// Trust badges scene
const TrustBadgesScene: React.FC<{
  clients: string[];
}> = ({ clients }) => {
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
          gap: 50,
        }}
      >
        <FadeIn delay={0} duration={40}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              fontFamily,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Trusted by industry leaders
          </div>
        </FadeIn>

        <div style={{ display: 'flex', gap: 50, flexWrap: 'wrap', justifyContent: 'center' }}>
          {clients.map((client, index) => (
            <FadeIn key={client} delay={40 + index * 20} duration={40}>
              <div
                style={{
                  padding: '20px 40px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    fontFamily,
                    color: 'rgba(255,255,255,0.8)',
                    letterSpacing: 1,
                  }}
                >
                  {client}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Certifications */}
        <SlideIn direction="bottom" delay={120} duration={40}>
          <div style={{ display: 'flex', gap: 30 }}>
            {['SOC 2', 'ISO 27001', 'GDPR'].map((cert, index) => (
              <div
                key={cert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    color: '#22c55e',
                  }}
                >
                  ✓
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {cert}
                </span>
              </div>
            ))}
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// CTA scene
const CTAScene: React.FC<{
  ctaText: string;
  companyName: string;
  primaryColor: string;
}> = ({ ctaText, companyName, primaryColor }) => {
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
          text="Ready to transform?"
          type="stagger"
          fontSize={48}
          fontWeight={700}
          color="#ffffff"
          staggerDelay={2}
        />

        <FadeIn delay={60} duration={40}>
          <Button
            text={ctaText}
            backgroundColor={primaryColor}
            textColor="#ffffff"
            fontSize={18}
            padding="16px 40px"
            borderRadius={8}
            pulse
            pulseSpeed={60}
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
            {companyName} • Enterprise Solutions
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const CorporateEnterprise: React.FC<CorporateEnterpriseProps> = ({
  companyName = 'Nexus',
  tagline = 'Enterprise Solutions Reimagined',
  stats = [
    { value: 99, suffix: '%', label: 'Uptime SLA' },
    { value: 500, suffix: '+', label: 'Enterprise Clients' },
    { value: 40, suffix: '%', label: 'Cost Reduction' },
  ],
  clients = ['Fortune 500', 'TechCorp', 'GlobalBank', 'MegaRetail'],
  globalLocations = 25,
  ctaText = 'Schedule a Demo',
  primaryColor = '#3b82f6',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#0f172a', '#1e293b', '#0f172a']}>
        {/* Scene 1: Brand Statement (0-180 frames) */}
        <Sequence from={0} durationInFrames={180}>
          <BrandStatementScene
            companyName={companyName}
            tagline={tagline}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 2: Problem/Solution (180-420 frames) */}
        <Sequence from={180} durationInFrames={240}>
          <ProblemSolutionScene primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 3: Data Visualization (420-660 frames) */}
        <Sequence from={420} durationInFrames={240}>
          <DataVizScene stats={stats} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 4: Global Reach (660-900 frames) */}
        <Sequence from={660} durationInFrames={240}>
          <GlobalReachScene
            globalLocations={globalLocations}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 5: Trust Badges (900-1080 frames) */}
        <Sequence from={900} durationInFrames={180}>
          <TrustBadgesScene clients={clients} />
        </Sequence>

        {/* Scene 6: CTA (1080-1200 frames) */}
        <Sequence from={1080} durationInFrames={120}>
          <CTAScene
            ctaText={ctaText}
            companyName={companyName}
            primaryColor={primaryColor}
          />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
