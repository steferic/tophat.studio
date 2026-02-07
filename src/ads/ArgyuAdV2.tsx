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
  Img,
} from 'remotion';
import { ThreeCanvas, RotatingCube, WireframeTorus, DramaticLighting } from '../three';

const { fontFamily: serifFont } = loadSerif();
const { fontFamily: sansFont } = loadSans();

// Argyu Ad V2 - 15 seconds @ 60fps = 900 frames
// Beat-synced cuts aligned to transients in argyu-beat.mp3
// Scenes: Provocation (0-194) -> Split Reveal (194-525) -> Testimonial (525-656) -> Logo (656-900)
// Beat frames: [194, 430, 466, 525, 561, 621, 656, 680, 715, 751, 763, 799, 835, 850, 882, 890]

const BLACK = '#1a1a1a';
const CREAM = '#faf9f7';
const CORAL = '#FF7050';

// Clean background
const EditorialBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// Scene 1: Provocative opener with word-by-word reveal
const ProvocationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ['Everyone', 'has', 'opinions.'];
  const words2 = ['Few', 'have', 'conviction.'];

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
        {/* First line */}
        <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
          {words.map((word, i) => {
            const delay = i * 12;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 100 },
            });
            const y = interpolate(progress, [0, 1], [80, 0]);

            return (
              <span
                key={word}
                style={{
                  fontSize: 72,
                  fontWeight: 400,
                  fontFamily: serifFont,
                  color: BLACK,
                  transform: `translateY(${y}px)`,
                  opacity: progress,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Second line */}
        <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
          {words2.map((word, i) => {
            const delay = 50 + i * 12;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 100 },
            });
            const y = interpolate(progress, [0, 1], [80, 0]);

            return (
              <span
                key={word}
                style={{
                  fontSize: 72,
                  fontWeight: 400,
                  fontFamily: serifFont,
                  color: i === 2 ? CORAL : BLACK,
                  fontStyle: i === 2 ? 'italic' : 'normal',
                  transform: `translateY(${y}px)`,
                  opacity: progress,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Underline that draws in */}
        <div
          style={{
            width: interpolate(
              spring({ frame: frame - 100, fps, config: { damping: 20 } }),
              [0, 1],
              [0, 300]
            ),
            height: 2,
            backgroundColor: BLACK,
            marginTop: 10,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Split screen with product and rotating text
const SplitRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Left panel slides in
  const leftSlide = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  // Right panel slides in slightly delayed
  const rightSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  // Rotating phrases on the right (scene is 331 frames)
  const phrases = [
    { text: 'Debate anyone.', start: 30, end: 120 },
    { text: 'Stake real money.', start: 120, end: 220 },
    { text: 'Let AI decide.', start: 220, end: 331 },
  ];

  // Screenshot scroll
  const scrollProgress = interpolate(frame, [30, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scrollEased = scrollProgress < 0.5
    ? 4 * scrollProgress * scrollProgress * scrollProgress
    : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  const scrollY = Math.round(scrollEased * 600);

  return (
    <AbsoluteFill>
      {/* Left side - Product screenshot */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '55%',
          height: '100%',
          backgroundColor: '#ffffff',
          transform: `translateX(${interpolate(leftSlide, [0, 1], [-100, 0])}%)`,
          opacity: leftSlide,
          overflow: 'hidden',
          boxShadow: '10px 0 40px rgba(0,0,0,0.1)',
        }}
      >
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

      {/* Right side - Rotating text */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '45%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateX(${interpolate(rightSlide, [0, 1], [100, 0])}%)`,
          opacity: rightSlide,
        }}
      >
        <div
          style={{
            padding: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
          }}
        >
          {phrases.map((phrase, i) => {
            const isActive = frame >= phrase.start && frame < phrase.end;
            const entering = frame >= phrase.start && frame < phrase.start + 30;
            const exiting = frame >= phrase.end - 20 && frame < phrase.end;

            let opacity = 0;
            let y = 30;

            if (entering) {
              const progress = (frame - phrase.start) / 30;
              opacity = progress;
              y = 30 * (1 - progress);
            } else if (exiting) {
              const progress = (frame - (phrase.end - 20)) / 20;
              opacity = 1 - progress;
              y = -20 * progress;
            } else if (isActive) {
              opacity = 1;
              y = 0;
            }

            return (
              <div
                key={phrase.text}
                style={{
                  fontSize: 56,
                  fontWeight: 400,
                  fontFamily: serifFont,
                  color: BLACK,
                  transform: `translateY(${y}px)`,
                  opacity,
                  position: 'absolute',
                  lineHeight: 1.3,
                }}
              >
                {phrase.text}
              </div>
            );
          })}

        </div>
      </div>
    </AbsoluteFill>
  );
};

// Styled testimonial card component
const TestimonialCard: React.FC<{
  quote: string;
  entrance: number;
}> = ({ quote, entrance }) => {
  return (
    <div
      style={{
        maxWidth: 1400,
        padding: '0 100px',
        opacity: entrance,
        transform: `scale(${interpolate(entrance, [0, 1], [0.95, 1])})`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontFamily: serifFont,
          fontStyle: 'italic',
          color: BLACK,
          lineHeight: 1.3,
        }}
      >
        "{quote}"
      </div>
    </div>
  );
};

// Scene 3: Testimonial - styled text
const TestimonialScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CREAM,
      }}
    >
      <TestimonialCard
        quote="Haven't seen anything this interesting in months"
        entrance={entrance}
      />
    </AbsoluteFill>
  );
};


// Argyu Logo SVG Component (without BETA)
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

// Scene 4: Logo finale with 3D elements
const LogoScene: React.FC = () => {
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
    <AbsoluteFill>
      {/* 3D Background */}
      <AbsoluteFill style={{ opacity: 0.15 }}>
        <ThreeCanvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <DramaticLighting mainColor="#FF7050" fillColor="#1a1a1a" intensity={1.5} />
          <RotatingCube
            size={3}
            color={CORAL}
            rotationSpeed={[0.15, 0.25, 0.1]}
            position={[-4, 1.5, 0]}
            entranceFrames={30}
            metalness={0.6}
            roughness={0.2}
          />
          <RotatingCube
            size={2}
            color={CORAL}
            rotationSpeed={[0.2, 0.15, 0.25]}
            rotationOffset={[0.5, 0.3, 0]}
            position={[4.5, -1, -2]}
            entranceFrames={45}
            metalness={0.6}
            roughness={0.2}
          />
          <WireframeTorus
            radius={5}
            tube={0.15}
            color={CORAL}
            rotationSpeed={[0.05, 0.08, 0.02]}
            position={[0, 0, -5]}
            entranceFrames={20}
          />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* Logo content */}
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
          <div
            style={{
              width: lineWidth,
              height: 1,
              backgroundColor: BLACK,
            }}
          />

          <ArgyuLogo scale={1.4} />

          <div
            style={{
              width: lineWidth,
              height: 1,
              backgroundColor: BLACK,
            }}
          />

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
    </AbsoluteFill>
  );
};

export const ArgyuAdV2: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: serifFont }}>
      <EditorialBackground>
        {/* Scene 1: Provocation (0-194 frames) - cuts on beat 1 */}
        <Sequence from={0} durationInFrames={194}>
          <ProvocationScene />
        </Sequence>

        {/* Scene 2: Split Reveal (194-525 frames) - cuts on beat 4 */}
        <Sequence from={194} durationInFrames={331}>
          <SplitRevealScene />
        </Sequence>

        {/* Scene 3: Testimonial (525-656 frames) - cuts on beat 7 */}
        <Sequence from={525} durationInFrames={131}>
          <TestimonialScene />
        </Sequence>

        {/* Scene 4: Logo (656-900 frames) */}
        <Sequence from={656} durationInFrames={244}>
          <LogoScene />
        </Sequence>

        {/* Audio */}
        <Sequence from={0} durationInFrames={900}>
          <Audio
            src={staticFile('audio/music/argyu-beat.mp3')}
            volume={0.7}
            startFrom={0}
          />
        </Sequence>
      </EditorialBackground>
    </AbsoluteFill>
  );
};
