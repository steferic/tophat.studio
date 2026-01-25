import React from 'react';
import { loadFont as loadSerif } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadSans } from '@remotion/google-fonts/Inter';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  Audio,
} from 'remotion';
import { Img } from 'remotion';

const { fontFamily: serifFont } = loadSerif();
const { fontFamily: sansFont } = loadSans();

// Argyu Ad - 19.5 seconds @ 60fps = 1170 frames
// NYT-style sophisticated aesthetic
// Scenes: Hook (180f) -> Combined Product+Value (420f) -> CTA (270f) -> URL (300f)

const BLACK = '#1a1a1a';
const WARM_BLACK = '#2d2d2d';
const CREAM = '#faf9f7';

// Clean white background with subtle texture
const EditorialBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, overflow: 'hidden' }}>
      {/* Subtle paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />
      {/* Subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.03) 100%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// Scene 1: Hook - editorial style question
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineReveal = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const subOpacity = spring({
    frame: frame - 50,
    fps,
    config: { damping: 20 },
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
          maxWidth: 900,
          textAlign: 'center',
        }}
      >
        {/* Decorative line above */}
        <div
          style={{
            width: interpolate(lineReveal, [0, 1], [0, 60]),
            height: 1,
            backgroundColor: BLACK,
          }}
        />

        <div
          style={{
            fontSize: 82,
            fontWeight: 500,
            fontFamily: serifFont,
            color: BLACK,
            opacity: textOpacity,
            lineHeight: 1.15,
            letterSpacing: '-1px',
          }}
        >
          Think you're
          <br />
          <em style={{ fontStyle: 'italic' }}>always</em> right?
        </div>

        {/* Decorative line below */}
        <div
          style={{
            width: interpolate(lineReveal, [0, 1], [0, 60]),
            height: 1,
            backgroundColor: BLACK,
          }}
        />

        <div
          style={{
            fontSize: 18,
            fontFamily: sansFont,
            color: WARM_BLACK,
            opacity: subOpacity,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Prove it
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Combined Product + Value Prop
const CombinedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser entrance animation
  const browserEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  // Perspective rotation
  const rotateY = interpolate(browserEntrance, [0, 1], [-15, -5]);
  const rotateX = interpolate(browserEntrance, [0, 1], [8, 2]);
  const translateZ = interpolate(browserEntrance, [0, 1], [-150, 0]);
  const browserScale = interpolate(browserEntrance, [0, 1], [0.85, 1]);

  // Continuous subtle float
  const floatY = Math.sin(frame * 0.025) * 3;
  const floatRotate = Math.sin(frame * 0.015) * 0.3;

  // Scroll animation for the screenshot
  const scrollProgress = interpolate(frame, [60, 350], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scrollEased = scrollProgress < 0.5
    ? 4 * scrollProgress * scrollProgress * scrollProgress
    : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  const scrollY = Math.round(scrollEased * 500);

  // Text lines with staggered entrance
  const lines = [
    { text: 'Stake your conviction.', delay: 30 },
    { text: 'Argue your case.', delay: 60 },
    { text: 'Win the pot.', delay: 90 },
  ];

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1500,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 80,
          width: '90%',
          maxWidth: 1600,
        }}
      >
        {/* Left side: 3D Browser mockup */}
        <div
          style={{
            flex: '0 0 55%',
            transform: `
              translateY(${floatY}px)
              translateZ(${translateZ}px)
              rotateY(${rotateY + floatRotate}deg)
              rotateX(${rotateX}deg)
              scale(${browserScale})
            `,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* Shadow underneath */}
          <div
            style={{
              position: 'absolute',
              bottom: -50,
              left: '10%',
              right: '10%',
              height: 60,
              background: 'rgba(0,0,0,0.12)',
              filter: 'blur(35px)',
              transform: 'translateZ(-40px) rotateX(90deg)',
            }}
          />

          {/* Browser frame */}
          <div
            style={{
              width: '100%',
              height: 500,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: `
                0 4px 6px rgba(0,0,0,0.05),
                0 10px 20px rgba(0,0,0,0.08),
                0 40px 80px rgba(0,0,0,0.12)
              `,
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {/* Minimal toolbar */}
            <div
              style={{
                height: 40,
                backgroundColor: '#fafafa',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                gap: 10,
              }}
            >
              {/* Traffic lights */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
                  <div
                    key={color}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
              {/* URL bar */}
              <div
                style={{
                  flex: 1,
                  marginLeft: 40,
                  marginRight: 40,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 5,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: '#666',
                  fontFamily: sansFont,
                  textAlign: 'center',
                }}
              >
                argyu.fun
              </div>
            </div>

            {/* Screenshot with scroll */}
            <div style={{ height: 460, overflow: 'hidden' }}>
              <div
                style={{
                  transform: `translate3d(0, ${-scrollY}px, 0)`,
                  willChange: 'transform',
                }}
              >
                <Img
                  src={staticFile('screenshots/argyu.png')}
                  style={{
                    width: '100%',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Value prop text */}
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {lines.map((line, i) => {
            const progress = spring({
              frame: frame - line.delay,
              fps,
              config: { damping: 15, stiffness: 100 },
            });

            const x = interpolate(progress, [0, 1], [60, 0]);

            return (
              <div
                key={line.text}
                style={{
                  fontSize: 48,
                  fontWeight: 400,
                  fontFamily: serifFont,
                  color: BLACK,
                  transform: `translateX(${x}px)`,
                  opacity: progress,
                  fontStyle: i === 2 ? 'italic' : 'normal',
                  lineHeight: 1.3,
                }}
              >
                {line.text}
              </div>
            );
          })}

          {/* Subtext */}
          <div
            style={{
              marginTop: 30,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: spring({ frame: frame - 140, fps }),
            }}
          >
            <div style={{ width: 30, height: 1, backgroundColor: BLACK }} />
            <span
              style={{
                fontSize: 14,
                fontFamily: sansFont,
                color: WARM_BLACK,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              AI-judged debates on Solana
            </span>
          </div>

          {/* Beta badge */}
          <div
            style={{
              marginTop: 10,
              opacity: spring({ frame: frame - 160, fps }),
              fontSize: 13,
              fontFamily: sansFont,
              color: WARM_BLACK,
              letterSpacing: 1,
            }}
          >
            Now in Beta
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: CTA - sophisticated
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const lineWidth = interpolate(
    spring({ frame: frame - 30, fps }),
    [0, 1],
    [0, 200]
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
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          transform: `scale(${interpolate(entrance, [0, 1], [0.95, 1])})`,
          opacity: entrance,
        }}
      >
        {/* Main headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            fontFamily: serifFont,
            color: BLACK,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          Put your money
          <br />
          where your mouth is.
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: BLACK,
            marginTop: 10,
            marginBottom: 10,
          }}
        />

        {/* CTA button - understated elegance */}
        <div
          style={{
            marginTop: 10,
            border: `1px solid ${BLACK}`,
            padding: '18px 50px',
            fontSize: 15,
            fontFamily: sansFont,
            color: BLACK,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: spring({ frame: frame - 40, fps }),
          }}
        >
          Visit argyu.fun
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 20,
            fontSize: 16,
            fontFamily: serifFont,
            fontStyle: 'italic',
            color: WARM_BLACK,
            opacity: spring({ frame: frame - 60, fps }),
          }}
        >
          Debate. Stake. Win.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Argyu Logo SVG Component
const ArgyuLogo: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <svg
    width={687 * scale}
    height={134 * scale}
    viewBox="0 0 687 134"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M433 20C433 8.95431 441.954 0 453 0H585C596.046 0 605 8.9543 605 20V113C605 124.046 596.046 133 585 133H453C441.954 133 433 124.046 433 113V20Z"
      fill="#FF7050"
    />
    <path
      d="M558.429 57.4634H534.958L528.851 76.0253H558.429V98.6058H521.409L515.875 115.254H489.16L494.694 98.6058H480V76.0253H502.136L508.242 57.4634H480V34.6915H515.684L520.837 19H547.552L542.4 34.6915H558.429V57.4634Z"
      fill="black"
    />
    <path
      d="M381.022 133.103C371.126 133.103 363.358 131.507 357.719 128.315C352.185 125.016 348.301 120.281 346.067 114.109C343.832 107.831 342.715 100.17 342.715 91.1248V1.90039H370.967V95.4344C370.967 98.0947 371.179 100.755 371.605 103.415C372.031 106.075 372.935 108.257 374.318 109.959C375.808 111.662 378.043 112.513 381.022 112.513C384.108 112.513 386.343 111.662 387.726 109.959C389.109 108.257 389.961 106.075 390.28 103.415C390.706 100.755 390.918 98.0947 390.918 95.4344V1.90039H419.33V91.1248C419.33 100.17 418.159 107.831 415.818 114.109C413.584 120.281 409.7 125.016 404.166 128.315C398.633 131.507 390.918 133.103 381.022 133.103Z"
      fill="black"
    />
    <path
      d="M284.756 131.188V78.3557L260.176 1.90039H287.151L299.441 42.7617L310.454 1.90039H336.312L312.21 78.3557V131.188H284.756Z"
      fill="black"
    />
    <path
      d="M215.249 133.101C206.31 133.101 199.234 131.239 194.02 127.515C188.912 123.791 185.241 118.576 183.007 111.873C180.879 105.062 179.814 97.2413 179.814 88.4093V44.9942C179.814 35.843 180.985 27.9155 183.326 21.2117C185.667 14.5079 189.657 9.34701 195.297 5.72909C201.043 2.00475 208.811 0.142578 218.601 0.142578C228.178 0.142578 235.679 1.73873 241.106 4.93102C246.64 8.1233 250.577 12.5393 252.918 18.179C255.259 23.8187 256.429 30.4161 256.429 37.9712V46.2711H228.497V35.7366C228.497 32.9699 228.284 30.4161 227.858 28.0751C227.539 25.7341 226.688 23.8719 225.305 22.4886C224.028 20.9989 221.899 20.254 218.92 20.254C215.834 20.254 213.599 21.1053 212.216 22.8078C210.833 24.404 209.928 26.4257 209.503 28.8732C209.184 31.3206 209.024 33.8744 209.024 36.5347V96.3901C209.024 99.2631 209.29 101.977 209.822 104.53C210.46 106.978 211.525 109 213.014 110.596C214.61 112.085 216.845 112.83 219.718 112.83C222.698 112.83 224.985 112.032 226.581 110.436C228.178 108.84 229.295 106.765 229.933 104.211C230.572 101.657 230.891 98.9439 230.891 96.0708V80.9075H219.239V64.1479H256.589V131.186H237.754L236.158 120.492C234.456 124.11 231.955 127.142 228.656 129.59C225.358 131.931 220.889 133.101 215.249 133.101Z"
      fill="black"
    />
    <path
      d="M90.625 131.188V1.90039H126.219C134.945 1.90039 142.5 2.85807 148.884 4.77345C155.269 6.68882 160.217 10.1471 163.728 15.1484C167.346 20.0432 169.155 27.0131 169.155 36.0579C169.155 41.3784 168.73 46.1136 167.878 50.2636C167.027 54.4135 165.431 58.0315 163.09 61.1173C160.855 64.0968 157.61 66.5974 153.353 68.6192L171.071 131.188H141.542L127.336 73.248H119.196V131.188H90.625ZM119.196 56.8077H127.177C131.22 56.8077 134.359 56.1161 136.594 54.7328C138.829 53.243 140.371 51.168 141.223 48.5078C142.18 45.7411 142.659 42.4424 142.659 38.6117C142.659 33.0784 141.648 28.7688 139.627 25.6829C137.605 22.5971 133.881 21.0541 128.454 21.0541H119.196V56.8077Z"
      fill="black"
    />
    <path
      d="M0 131.188L24.421 1.90039H56.9823L81.0841 131.188H54.7477L50.4382 103.894H31.444L26.9748 131.188H0ZM33.9979 86.8153H47.7247L40.8613 36.3771L33.9979 86.8153Z"
      fill="black"
    />
  </svg>
);

// Scene 5: Final URL display with logo
const URLScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const lineWidth = interpolate(
    spring({ frame: frame - 20, fps }),
    [0, 1],
    [0, 120]
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
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])})`,
          opacity: entrance,
        }}
      >
        {/* Decorative line above */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: BLACK,
          }}
        />

        {/* Logo */}
        <ArgyuLogo scale={1.4} />

        {/* Decorative line below */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: BLACK,
          }}
        />

        {/* URL text */}
        <div
          style={{
            fontSize: 24,
            fontFamily: sansFont,
            color: BLACK,
            letterSpacing: 2,
            opacity: spring({ frame: frame - 30, fps }),
          }}
        >
          visit at www.argyu.fun
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ArgyuAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: serifFont }}>
      <EditorialBackground>
        {/* Scene 1: Hook (0-180 frames / 3s) */}
        <Sequence from={0} durationInFrames={180}>
          <HookScene />
        </Sequence>

        {/* Scene 2: Combined Product + Value Prop (180-600 frames / 7s) */}
        <Sequence from={180} durationInFrames={420}>
          <CombinedScene />
        </Sequence>

        {/* Scene 3: CTA (600-870 frames / 4.5s) */}
        <Sequence from={600} durationInFrames={270}>
          <CTAScene />
        </Sequence>

        {/* Scene 4: URL (870-1170 frames / 5s) */}
        <Sequence from={870} durationInFrames={300}>
          <URLScene />
        </Sequence>

        {/* Audio */}
        <Sequence from={0} durationInFrames={1170}>
          <Audio
            src={staticFile('audio/argyu-beat.mp3')}
            volume={0.7}
            startFrom={0}
          />
        </Sequence>
      </EditorialBackground>
    </AbsoluteFill>
  );
};
