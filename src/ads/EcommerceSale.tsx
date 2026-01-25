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
import { FadeIn, SlideIn, ScaleIn } from '../components/animations';
import { Badge, Button, PriceTag } from '../components/ui';
import { GradientBackground } from '../components/layouts';

const { fontFamily } = loadFont();

// E-commerce Flash Sale Ad - 10 seconds @ 60fps = 600 frames
// Scenes: Attention Grabber (90f) -> Product Showcase (180f) -> Price Reveal (150f) -> Urgency + CTA (180f)

interface EcommerceSaleProps {
  brandName?: string;
  productName?: string;
  originalPrice?: number;
  salePrice?: number;
  discount?: string;
  features?: string[];
  ctaText?: string;
  urgencyText?: string;
  primaryColor?: string;
  accentColor?: string;
}

// Attention-grabbing intro
const AttentionScene: React.FC<{
  discount: string;
  primaryColor: string;
}> = ({ discount, primaryColor }) => {
  const frame = useCurrentFrame();

  // Shake effect
  const shake = frame < 60
    ? Math.sin(frame * 2) * interpolate(frame, [0, 60], [8, 0])
    : 0;

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateX(${shake}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <ScaleIn delay={0} duration={30} initialScale={2}>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              fontFamily,
              color: primaryColor,
              textShadow: `0 0 40px ${primaryColor}`,
            }}
          >
            {discount}
          </div>
        </ScaleIn>

        <SlideIn direction="bottom" delay={30} duration={30}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: 8,
            }}
          >
            FLASH SALE
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// Product showcase with rotating features
const ProductScene: React.FC<{
  productName: string;
  features: string[];
  primaryColor: string;
}> = ({ productName, features, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Product "card" animation
  const cardProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 50,
  });

  // Floating animation for product
  const float = Math.sin(frame * 0.05) * 5;

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
          gap: 60,
          alignItems: 'center',
        }}
      >
        {/* Product visual */}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
            border: `2px solid ${primaryColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${cardProgress}) translateY(${float}px)`,
            boxShadow: `0 20px 60px ${primaryColor}33`,
          }}
        >
          <div style={{ fontSize: 100 }}>🎧</div>
        </div>

        {/* Product info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <SlideIn direction="right" delay={40} duration={40}>
            <Badge text="Best Seller" backgroundColor={primaryColor} pulse />
          </SlideIn>

          <SlideIn direction="right" delay={60} duration={40}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                fontFamily,
                color: '#ffffff',
              }}
            >
              {productName}
            </div>
          </SlideIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((feature, index) => (
              <SlideIn
                key={feature}
                direction="right"
                delay={90 + index * 24}
                duration={30}
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
                      color: primaryColor,
                      fontSize: 20,
                    }}
                  >
                    ✓
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      fontFamily,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {feature}
                  </span>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Price reveal with dramatic effect
const PriceScene: React.FC<{
  originalPrice: number;
  salePrice: number;
  primaryColor: string;
}> = ({ originalPrice, salePrice, primaryColor }) => {
  const frame = useCurrentFrame();

  // Flash effect on reveal
  const flashOpacity = interpolate(frame, [30, 40, 50], [0, 0.5, 0], {
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
      {/* Flash overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: primaryColor,
          opacity: flashOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <FadeIn delay={0} duration={40}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              fontFamily,
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            Limited Time Price
          </div>
        </FadeIn>

        <PriceTag
          originalPrice={originalPrice}
          salePrice={salePrice}
          delay={30}
          saleColor={primaryColor}
        />

        <SlideIn direction="bottom" delay={70} duration={40}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              fontFamily,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            You save ${originalPrice - salePrice}!
          </div>
        </SlideIn>
      </div>
    </AbsoluteFill>
  );
};

// Urgency countdown + CTA
const UrgencyCTAScene: React.FC<{
  urgencyText: string;
  ctaText: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
}> = ({ urgencyText, ctaText, brandName, primaryColor, accentColor }) => {
  const frame = useCurrentFrame();

  // Countdown timer animation
  const timerPulse = Math.sin(frame * 0.15) * 0.05 + 1;

  // Simulated countdown (for visual effect)
  const hours = 2;
  const minutes = Math.max(0, 59 - Math.floor(frame / 60));
  const seconds = Math.max(0, 59 - (frame % 60));

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
        {/* Urgency badge */}
        <ScaleIn delay={0} duration={30}>
          <Badge
            text={urgencyText}
            backgroundColor={accentColor}
            textColor="#000000"
            fontSize={16}
            pulse
          />
        </ScaleIn>

        {/* Countdown timer */}
        <FadeIn delay={20} duration={40}>
          <div
            style={{
              display: 'flex',
              gap: 20,
              transform: `scale(${timerPulse})`,
            }}
          >
            {[
              { value: hours, label: 'HRS' },
              { value: minutes, label: 'MIN' },
              { value: seconds, label: 'SEC' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 900,
                    fontFamily,
                    color: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: '15px 25px',
                    borderRadius: 12,
                    minWidth: 100,
                    textAlign: 'center',
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 8,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* CTA Button */}
        <ScaleIn delay={60} duration={40}>
          <Button
            text={ctaText}
            backgroundColor={primaryColor}
            textColor="#ffffff"
            fontSize={24}
            padding="20px 60px"
            borderRadius={50}
            pulse
            pulseSpeed={30}
          />
        </ScaleIn>

        {/* Brand */}
        <FadeIn delay={100} duration={40}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: 2,
            }}
          >
            {brandName}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

export const EcommerceSale: React.FC<EcommerceSaleProps> = ({
  brandName = 'SOUNDWAVE',
  productName = 'ProMax Headphones',
  originalPrice = 299,
  salePrice = 149,
  discount = '50% OFF',
  features = ['Active Noise Cancellation', '40hr Battery Life', 'Premium Sound'],
  ctaText = 'Shop Now',
  urgencyText = 'Ends Tonight!',
  primaryColor = '#ef4444',
  accentColor = '#fbbf24',
}) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <GradientBackground colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}>
        {/* Scene 1: Attention Grabber (0-90 frames) */}
        <Sequence from={0} durationInFrames={90}>
          <AttentionScene discount={discount} primaryColor={primaryColor} />
        </Sequence>

        {/* Scene 2: Product Showcase (90-270 frames) */}
        <Sequence from={90} durationInFrames={180}>
          <ProductScene
            productName={productName}
            features={features}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 3: Price Reveal (270-420 frames) */}
        <Sequence from={270} durationInFrames={150}>
          <PriceScene
            originalPrice={originalPrice}
            salePrice={salePrice}
            primaryColor={primaryColor}
          />
        </Sequence>

        {/* Scene 4: Urgency + CTA (420-600 frames) */}
        <Sequence from={420} durationInFrames={180}>
          <UrgencyCTAScene
            urgencyText={urgencyText}
            ctaText={ctaText}
            brandName={brandName}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
};
