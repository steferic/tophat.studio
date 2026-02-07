/**
 * Argyu Ad V3 - Classical Edition
 *
 * A sophisticated ad set to Ravel's String Quartet in F.
 * Cinematic, elegant typography with 3D rose on mathematical path.
 * Duration: ~25 seconds @ 60fps = 1500 frames
 */

import React, { useMemo } from 'react';
import { loadFont as loadSans } from '@remotion/google-fonts/Inter';
import { loadFont as loadDisplay } from '@remotion/google-fonts/Cormorant';
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
  Video,
  Easing,
} from 'remotion';
import * as THREE from 'three';
import { ThreeCanvas, WireframeTorus, DramaticLighting } from '../three';
import { MandelbrotPlane } from '../math-animations';

const { fontFamily: sansFont } = loadSans();
const { fontFamily: displayFont } = loadDisplay();

// Duration: 25 seconds @ 60fps = 1500 frames
// Scene breakdown:
// 1. Opening (0-450): "What if your opinion was worth something?" + Rose on Lissajous
// 2. Product Reveal (450-900): Browser mockup with elegant entrance
// 3. Value Props (900-1200): Three pillars appear
// 4. Logo Finale (1200-1500): Grand finale with 3D

const DEEP_BLACK = '#0a0a0a';
const WARM_WHITE = '#fffef9';
const GOLD = '#c9a962';
const CORAL = '#FF7050';

// ============================================================================
// Elegant Background with subtle texture
// ============================================================================

const CinematicBackground: React.FC<{
  children: React.ReactNode;
  opacity?: number;
}> = ({ children, opacity = 0.85 }) => {
  const frame = useCurrentFrame();

  // Subtle vignette animation
  const vignetteIntensity = interpolate(
    Math.sin(frame * 0.01),
    [-1, 1],
    [0.2, 0.3]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(255, 254, 249, ${opacity})`,
        overflow: 'hidden',
      }}
    >
      {/* Film grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.02,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)`,
          opacity: vignetteIntensity,
        }}
      />

      {children}
    </AbsoluteFill>
  );
};

// ============================================================================
// Cube to Sphere Point Cloud Morph
// ============================================================================

const PARTICLE_COUNT = 3000;
const CUBE_SIZE = 12;
const SPHERE_RADIUS = 10;

const generateMatchedPoints = (count: number, cubeSize: number, sphereRadius: number) => {
  const cubePoints: number[] = [];
  const spherePoints: number[] = [];

  const halfSize = cubeSize / 2;
  const pointsPerFace = Math.floor(count / 6);

  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < pointsPerFace; i++) {
      const u = (i * 0.618033988749895) % 1;
      const v = i / pointsPerFace;

      let x: number, y: number, z: number;

      switch (face) {
        case 0: x = (u - 0.5) * cubeSize; y = (v - 0.5) * cubeSize; z = halfSize; break;
        case 1: x = (u - 0.5) * cubeSize; y = (v - 0.5) * cubeSize; z = -halfSize; break;
        case 2: x = (u - 0.5) * cubeSize; y = halfSize; z = (v - 0.5) * cubeSize; break;
        case 3: x = (u - 0.5) * cubeSize; y = -halfSize; z = (v - 0.5) * cubeSize; break;
        case 4: x = halfSize; y = (u - 0.5) * cubeSize; z = (v - 0.5) * cubeSize; break;
        default: x = -halfSize; y = (u - 0.5) * cubeSize; z = (v - 0.5) * cubeSize; break;
      }

      cubePoints.push(x, y, z);

      const length = Math.sqrt(x * x + y * y + z * z);
      if (length > 0) {
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        spherePoints.push(nx * sphereRadius, ny * sphereRadius, nz * sphereRadius);
      } else {
        spherePoints.push(0, sphereRadius, 0);
      }
    }
  }

  while (cubePoints.length < count * 3) {
    cubePoints.push(0, 0, 0);
    spherePoints.push(0, 0, 0);
  }

  return {
    cube: new Float32Array(cubePoints),
    sphere: new Float32Array(spherePoints),
  };
};

const CubeToSphereMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Progress through morph (0 = cube, 1 = sphere)
  const morphProgress = interpolate(frame, [30, 400], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const { cube: cubePoints, sphere: spherePoints } = useMemo(
    () => generateMatchedPoints(PARTICLE_COUNT, CUBE_SIZE, SPHERE_RADIUS),
    []
  );

  const randomOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const seed1 = Math.sin(i * 12.9898 + 1) * 43758.5453;
      const seed2 = Math.sin(i * 78.233 + 2) * 43758.5453;
      const seed3 = Math.sin(i * 45.164 + 3) * 43758.5453;
      offsets.push(
        (seed1 - Math.floor(seed1)) - 0.5,
        (seed2 - Math.floor(seed2)) - 0.5,
        (seed3 - Math.floor(seed3)) - 0.5
      );
    }
    return offsets;
  }, []);

  const currentPositions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const t = Easing.inOut(Easing.cubic)(morphProgress);
    const chaos = Math.sin(morphProgress * Math.PI) * 1.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.lerp(cubePoints[i3], spherePoints[i3], t) + randomOffsets[i3] * chaos;
      positions[i3 + 1] = THREE.MathUtils.lerp(cubePoints[i3 + 1], spherePoints[i3 + 1], t) + randomOffsets[i3 + 1] * chaos;
      positions[i3 + 2] = THREE.MathUtils.lerp(cubePoints[i3 + 2], spherePoints[i3 + 2], t) + randomOffsets[i3 + 2] * chaos;
    }
    return positions;
  }, [morphProgress, cubePoints, spherePoints, randomOffsets]);

  // Coral to gold color transition
  const currentColors = useMemo(() => {
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const cubeColor = new THREE.Color(CORAL);
    const sphereColor = new THREE.Color(GOLD);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      colors[i3] = THREE.MathUtils.lerp(cubeColor.r, sphereColor.r, morphProgress);
      colors[i3 + 1] = THREE.MathUtils.lerp(cubeColor.g, sphereColor.g, morphProgress);
      colors[i3 + 2] = THREE.MathUtils.lerp(cubeColor.b, sphereColor.b, morphProgress);
    }
    return colors;
  }, [morphProgress]);

  const rotY = time * 0.3;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));
    return geo;
  }, [currentPositions, currentColors]);

  // Entrance animation
  const entrance = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  return (
    <group rotation={[0.2, rotY, 0]} scale={entrance}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.25}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  );
};

// ============================================================================
// Scene 1: Opening - Combined text with Rose
// ============================================================================

const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // All words in sequence
  const line1 = ['What', 'if', 'your', 'opinion'];
  const line2 = ['was', 'worth', 'something?'];

  // First line word elements
  const line1Elements = line1.map((word, i) => {
    const delay = i * 20 + 30;
    const progress = spring({
      frame: frame - delay,
      fps,
      config: { damping: 30, stiffness: 80, mass: 1 },
    });

    const y = interpolate(progress, [0, 1], [50, 0]);
    const opacity = interpolate(progress, [0, 0.3, 1], [0, 0.8, 1]);

    const isHighlight = i === 3; // "opinion"

    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          fontSize: isHighlight ? 110 : 90,
          fontWeight: isHighlight ? 600 : 300,
          fontFamily: displayFont,
          color: isHighlight ? CORAL : DEEP_BLACK,
          fontStyle: isHighlight ? 'italic' : 'normal',
          transform: `translateY(${y}px)`,
          opacity,
          marginRight: 25,
          letterSpacing: isHighlight ? 3 : 1,
        }}
      >
        {word}
      </span>
    );
  });

  // Second line word elements (delayed)
  const line2Elements = line2.map((word, i) => {
    const delay = i * 25 + 180; // Start after first line
    const progress = spring({
      frame: frame - delay,
      fps,
      config: { damping: 25, stiffness: 90, mass: 0.8 },
    });

    const y = interpolate(progress, [0, 1], [40, 0]);
    const opacity = progress;

    const isWorth = i === 1; // "worth" - just orange, no other changes

    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          fontSize: 90,
          fontWeight: 300,
          fontFamily: displayFont,
          color: isWorth ? CORAL : DEEP_BLACK,
          transform: `translateY(${y}px)`,
          opacity,
          marginRight: 30,
          letterSpacing: 1,
        }}
      >
        {word}
      </span>
    );
  });

  // Decorative lines
  const line1Done = frame > 150;
  const lineProgress = spring({
    frame: frame - 320,
    fps,
    config: { damping: 30, stiffness: 60 },
  });

  return (
    <CinematicBackground opacity={0.5}>
      {/* 3D Cube to Sphere morph */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        <ThreeCanvas camera={{ position: [0, 0, 35], fov: 50 }}>
          <ambientLight intensity={1.2} />
          <CubeToSphereMorph />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* Text content */}
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
          {/* First line */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {line1Elements}
          </div>

          {/* Second line */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {line2Elements}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 180,
            width: interpolate(lineProgress, [0, 1], [0, 250]),
            height: 2,
            backgroundColor: CORAL,
            opacity: 0.7,
          }}
        />
      </AbsoluteFill>
    </CinematicBackground>
  );
};

// ============================================================================
// Scene 2: Product Reveal with elegant browser mockup
// ============================================================================

const ProductRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser mockup entrance
  const browserEntrance = spring({
    frame: frame - 30,
    fps,
    config: { damping: 25, stiffness: 60, mass: 1.2 },
  });

  const browserY = interpolate(browserEntrance, [0, 1], [100, 0]);
  const browserScale = interpolate(browserEntrance, [0, 1], [0.9, 1]);
  const browserOpacity = interpolate(browserEntrance, [0, 0.5, 1], [0, 0.8, 1]);

  // Screenshot scroll
  const scrollProgress = interpolate(frame, [100, 400], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scrollEased = Easing.inOut(Easing.cubic)(scrollProgress);
  const scrollY = Math.round(scrollEased * 500);

  // Title text
  const titleEntrance = spring({
    frame: frame - 60,
    fps,
    config: { damping: 30 },
  });

  return (
    <CinematicBackground opacity={0.55}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Title above browser */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            fontSize: 28,
            fontFamily: sansFont,
            fontWeight: 500,
            color: DEEP_BLACK,
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity: titleEntrance,
            transform: `translateY(${interpolate(titleEntrance, [0, 1], [20, 0])}px)`,
          }}
        >
          Introducing
        </div>

        {/* Browser mockup */}
        <div
          style={{
            transform: `translateY(${browserY}px) scale(${browserScale})`,
            opacity: browserOpacity,
            width: '80%',
            maxWidth: 1200,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              height: 48,
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 8,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
            <div
              style={{
                flex: 1,
                marginLeft: 80,
                marginRight: 80,
                height: 28,
                backgroundColor: '#ffffff',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: '#666',
                fontFamily: sansFont,
              }}
            >
              argyu.fun
            </div>
          </div>

          {/* Screenshot content */}
          <div
            style={{
              height: 600,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: `translateY(${-scrollY}px)`,
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
      </AbsoluteFill>
    </CinematicBackground>
  );
};

// ============================================================================
// Scene 3: Value Props - Three Pillars
// ============================================================================

const ValuePropsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const props = [
    { title: 'Debate', subtitle: 'Anyone, anywhere', icon: '💬' },
    { title: 'Stake', subtitle: 'Real money on Solana', icon: '💎' },
    { title: 'Win', subtitle: 'AI judges fairly', icon: '🏆' },
  ];

  return (
    <CinematicBackground opacity={0.5}>
      {/* Content */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 120,
          }}
        >
          {props.map((prop, i) => {
            const delay = i * 20 + 30;
            const entrance = spring({
              frame: frame - delay,
              fps,
              config: { damping: 20, stiffness: 100 },
            });

            const y = interpolate(entrance, [0, 1], [40, 0]);

            return (
              <div
                key={prop.title}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  opacity: entrance,
                  transform: `translateY(${y}px)`,
                }}
              >
                <span style={{ fontSize: 64 }}>{prop.icon}</span>
                <div
                  style={{
                    fontSize: 48,
                    fontFamily: displayFont,
                    fontWeight: 600,
                    color: DEEP_BLACK,
                    letterSpacing: 2,
                  }}
                >
                  {prop.title}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontFamily: sansFont,
                    color: CORAL,
                    letterSpacing: 1,
                  }}
                >
                  {prop.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative lines */}
        {props.map((_, i) => {
          if (i === props.length - 1) return null;
          const lineEntrance = spring({
            frame: frame - 80,
            fps,
            config: { damping: 30 },
          });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${33 + i * 33}%`,
                top: '35%',
                width: 1,
                height: interpolate(lineEntrance, [0, 1], [0, 200]),
                backgroundColor: DEEP_BLACK,
                opacity: 0.15,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </CinematicBackground>
  );
};

// ============================================================================
// Scene 4: Logo Finale with 3D
// ============================================================================

// Argyu Logo SVG
const ArgyuLogo: React.FC<{ scale?: number; color?: string }> = ({
  scale = 1,
  color = DEEP_BLACK
}) => (
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
      fill={color}
    />
    <path
      d="M381.022 133.103C371.126 133.103 363.358 131.507 357.719 128.315C352.185 125.016 348.301 120.281 346.067 114.109C343.832 107.831 342.715 100.17 342.715 91.1248V1.90039H370.967V95.4344C370.967 98.0947 371.179 100.755 371.605 103.415C372.031 106.075 372.935 108.257 374.318 109.959C375.808 111.662 378.043 112.513 381.022 112.513C384.108 112.513 386.343 111.662 387.726 109.959C389.109 108.257 389.961 106.075 390.28 103.415C390.706 100.755 390.918 98.0947 390.918 95.4344V1.90039H419.33V91.1248C419.33 100.17 418.159 107.831 415.818 114.109C413.584 120.281 409.7 125.016 404.166 128.315C398.633 131.507 390.918 133.103 381.022 133.103Z"
      fill={color}
    />
    <path
      d="M284.756 131.188V78.3557L260.176 1.90039H287.151L299.441 42.7617L310.454 1.90039H336.312L312.21 78.3557V131.188H284.756Z"
      fill={color}
    />
    <path
      d="M215.249 133.101C206.31 133.101 199.234 131.239 194.02 127.515C188.912 123.791 185.241 118.576 183.007 111.873C180.879 105.062 179.814 97.2413 179.814 88.4093V44.9942C179.814 35.843 180.985 27.9155 183.326 21.2117C185.667 14.5079 189.657 9.34701 195.297 5.72909C201.043 2.00475 208.811 0.142578 218.601 0.142578C228.178 0.142578 235.679 1.73873 241.106 4.93102C246.64 8.1233 250.577 12.5393 252.918 18.179C255.259 23.8187 256.429 30.4161 256.429 37.9712V46.2711H228.497V35.7366C228.497 32.9699 228.284 30.4161 227.858 28.0751C227.539 25.7341 226.688 23.8719 225.305 22.4886C224.028 20.9989 221.899 20.254 218.92 20.254C215.834 20.254 213.599 21.1053 212.216 22.8078C210.833 24.404 209.928 26.4257 209.503 28.8732C209.184 31.3206 209.024 33.8744 209.024 36.5347V96.3901C209.024 99.2631 209.29 101.977 209.822 104.53C210.46 106.978 211.525 109 213.014 110.596C214.61 112.085 216.845 112.83 219.718 112.83C222.698 112.83 224.985 112.032 226.581 110.436C228.178 108.84 229.295 106.765 229.933 104.211C230.572 101.657 230.891 98.9439 230.891 96.0708V80.9075H219.239V64.1479H256.589V131.186H237.754L236.158 120.492C234.456 124.11 231.955 127.142 228.656 129.59C225.358 131.931 220.889 133.101 215.249 133.101Z"
      fill={color}
    />
    <path
      d="M90.625 131.188V1.90039H126.219C134.945 1.90039 142.5 2.85807 148.884 4.77345C155.269 6.68882 160.217 10.1471 163.728 15.1484C167.346 20.0432 169.155 27.0131 169.155 36.0579C169.155 41.3784 168.73 46.1136 167.878 50.2636C167.027 54.4135 165.431 58.0315 163.09 61.1173C160.855 64.0968 157.61 66.5974 153.353 68.6192L171.071 131.188H141.542L127.336 73.248H119.196V131.188H90.625ZM119.196 56.8077H127.177C131.22 56.8077 134.359 56.1161 136.594 54.7328C138.829 53.243 140.371 51.168 141.223 48.5078C142.18 45.7411 142.659 42.4424 142.659 38.6117C142.659 33.0784 141.648 28.7688 139.627 25.6829C137.605 22.5971 133.881 21.0541 128.454 21.0541H119.196V56.8077Z"
      fill={color}
    />
    <path
      d="M0 131.188L24.421 1.90039H56.9823L81.0841 131.188H54.7477L50.4382 103.894H31.444L26.9748 131.188H0ZM33.9979 86.8153H47.7247L40.8613 36.3771L33.9979 86.8153Z"
      fill={color}
    />
  </svg>
);

const LogoFinaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grand entrance
  const logoEntrance = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.5 },
  });

  const scale = interpolate(logoEntrance, [0, 1], [0.85, 1]);
  const opacity = interpolate(logoEntrance, [0, 0.3, 1], [0, 0.6, 1]);

  // Decorative lines
  const lineWidth = interpolate(
    spring({ frame: frame - 60, fps, config: { damping: 30 } }),
    [0, 1],
    [0, 180]
  );

  // Tagline entrance
  const taglineEntrance = spring({
    frame: frame - 100,
    fps,
    config: { damping: 25 },
  });

  // URL entrance
  const urlEntrance = spring({
    frame: frame - 140,
    fps,
    config: { damping: 25 },
  });

  // Corner video entrance
  const videoEntrance = spring({
    frame: frame - 20,
    fps,
    config: { damping: 25, stiffness: 80 },
  });

  const cornerVideoStyle: React.CSSProperties = {
    width: 140,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    opacity: videoEntrance,
    transform: `scale(${interpolate(videoEntrance, [0, 1], [0.8, 1])})`,
  };

  return (
    <AbsoluteFill>
      {/* Semi-transparent overlay + 3D elements */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(255, 254, 249, 0.5)' }}>
        <AbsoluteFill style={{ opacity: 0.12 }}>
          <ThreeCanvas camera={{ position: [0, 0, 10], fov: 45 }}>
            <DramaticLighting mainColor="#FF7050" fillColor="#c9a962" intensity={1.2} />
            <WireframeTorus
              radius={8}
              tube={0.1}
              color={CORAL}
              rotationSpeed={[0.02, 0.03, 0.01]}
              position={[0, 0, -8]}
              entranceFrames={30}
            />
            <WireframeTorus
              radius={5}
              tube={0.08}
              color={GOLD}
              rotationSpeed={[-0.03, 0.02, 0.02]}
              position={[0, 0, -5]}
              entranceFrames={45}
            />
          </ThreeCanvas>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Corner videos - flower abstract */}
      {/* Top Left */}
      <div style={{ position: 'absolute', top: 40, left: 40, ...cornerVideoStyle }}>
        <Video
          src={staticFile('videos/flower-abstract.mp4')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
        />
      </div>

      {/* Top Right */}
      <div style={{ position: 'absolute', top: 40, right: 40, ...cornerVideoStyle }}>
        <Video
          src={staticFile('videos/flower-abstract.mp4')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
        />
      </div>

      {/* Bottom Left */}
      <div style={{ position: 'absolute', bottom: 40, left: 40, ...cornerVideoStyle }}>
        <Video
          src={staticFile('videos/flower-abstract.mp4')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
        />
      </div>

      {/* Bottom Right */}
      <div style={{ position: 'absolute', bottom: 40, right: 40, ...cornerVideoStyle }}>
        <Video
          src={staticFile('videos/flower-abstract.mp4')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
        />
      </div>

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
            gap: 50,
            transform: `scale(${scale})`,
            opacity,
          }}
        >
          {/* Top line */}
          <div
            style={{
              width: lineWidth,
              height: 1,
              backgroundColor: DEEP_BLACK,
              opacity: 0.3,
            }}
          />

          {/* Logo */}
          <ArgyuLogo scale={1.3} color={DEEP_BLACK} />

          {/* Bottom line */}
          <div
            style={{
              width: lineWidth,
              height: 1,
              backgroundColor: DEEP_BLACK,
              opacity: 0.3,
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontFamily: displayFont,
              fontWeight: 400,
              fontStyle: 'italic',
              color: DEEP_BLACK,
              letterSpacing: 4,
              opacity: taglineEntrance,
              transform: `translateY(${interpolate(taglineEntrance, [0, 1], [15, 0])}px)`,
            }}
          >
            Debate. Stake. Win.
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 22,
              fontFamily: sansFont,
              fontWeight: 500,
              color: CORAL,
              letterSpacing: 3,
              opacity: urlEntrance,
              transform: `translateY(${interpolate(urlEntrance, [0, 1], [10, 0])}px)`,
            }}
          >
            www.argyu.fun
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// Global Mandelbrot Background
// ============================================================================

const MandelbrotBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Animate zoom through the entire video
  const zoomProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const initialScale = 3.5;
  const finalScale = 0.00005;
  const currentScale = initialScale * Math.pow(finalScale / initialScale, zoomProgress);

  // Target an interesting spot in the Mandelbrot set
  const targetX = -0.743643887037151;
  const targetY = 0.131825904205330;
  const centerX = interpolate(zoomProgress, [0, 0.2], [-0.5, targetX], { extrapolateRight: 'clamp' });
  const centerY = interpolate(zoomProgress, [0, 0.2], [0, targetY], { extrapolateRight: 'clamp' });

  // Increase iterations as we zoom deeper
  const dynamicIterations = Math.floor(200 + zoomProgress * 600);

  return (
    <AbsoluteFill style={{ opacity: 0.85 }}>
      <ThreeCanvas camera={{ position: [0, 0, 1], fov: 90 }}>
        <MandelbrotPlane
          center={[centerX, centerY]}
          scale={currentScale}
          maxIterations={dynamicIterations}
          colorPalette="warm"
          aspectRatio={width / height}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// Main Composition
// ============================================================================

export const ArgyuAdV3: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: WARM_WHITE }}>
      {/* Global Mandelbrot background - animates through entire video */}
      <MandelbrotBackground />

      {/* Scene 1: Opening with cube-to-sphere morph (0-450 frames / 7.5 sec) */}
      <Sequence from={0} durationInFrames={450}>
        <OpeningScene />
      </Sequence>

      {/* Scene 2: Product Reveal (450-900 frames / 7.5 sec) */}
      <Sequence from={450} durationInFrames={450}>
        <ProductRevealScene />
      </Sequence>

      {/* Scene 3: Value Props (900-1200 frames / 5 sec) */}
      <Sequence from={900} durationInFrames={300}>
        <ValuePropsScene />
      </Sequence>

      {/* Scene 4: Logo Finale (1200-1500 frames / 5 sec) */}
      <Sequence from={1200} durationInFrames={300}>
        <LogoFinaleScene />
      </Sequence>

      {/* Audio - Ravel String Quartet (skip 4 sec silence = 240 frames @ 60fps) */}
      <Sequence from={0} durationInFrames={1500}>
        <Audio
          src={staticFile('audio/music/ravel-string-quartet.mp3')}
          volume={0.75}
          startFrom={240}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

export default ArgyuAdV3;
