import { loadFont } from "@remotion/google-fonts/RobotoMono";
import {
  AbsoluteFill,
  interpolate,
  spring,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont();

// Colors
const COLOR_BG = "#ffffff";
const COLOR_TEXT = "#000000";

// Bright pastel highlights
const COLORS = {
  pink: "#FF6B9D",
  mint: "#7FDBCA",
  lavender: "#B794F6",
  peach: "#FFAB76",
  sky: "#74C0FC",
};

// Font
const FONT_SIZE = 100;
const FONT_WEIGHT = 700;

// Typewriter effect for "alex"
const Typewriter = ({
  text,
  startFrame,
  charFrames = 6,
}: {
  text: string;
  startFrame: number;
  charFrames?: number;
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const charsToShow = Math.min(
    text.length,
    Math.floor(relativeFrame / charFrames)
  );
  const displayText = text.slice(0, charsToShow);

  // Blinking cursor
  const cursorOpacity = interpolate(
    relativeFrame % 16,
    [0, 8, 16],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const showCursor = charsToShow < text.length;

  return (
    <span>
      {displayText}
      {showCursor && <span style={{ opacity: cursorOpacity }}>{"\u258C"}</span>}
    </span>
  );
};

// Fade + Scale effect for "is"
const FadeScale = ({
  text,
  startFrame,
  duration,
}: {
  text: string;
  startFrame: number;
  duration: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const progress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: duration,
  });

  const opacity = progress;
  const scale = interpolate(progress, [0, 1], [0.5, 1]);

  return (
    <span
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
};

// Word highlight effect
const WordHighlight = ({
  word,
  startFrame,
  duration,
  highlightColor,
}: {
  word: string;
  startFrame: number;
  duration: number;
  highlightColor: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) return null;

  const highlightProgress = spring({
    fps,
    frame: relativeFrame,
    config: { damping: 200 },
    durationInFrames: duration,
  });

  const textOpacity = spring({
    fps,
    frame: relativeFrame,
    config: { damping: 15 },
    durationInFrames: Math.floor(duration / 2),
  });

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: "-0.1em",
          right: "-0.1em",
          top: "50%",
          height: "1.1em",
          transform: `translateY(-50%) scaleX(${highlightProgress})`,
          transformOrigin: "left center",
          backgroundColor: highlightColor,
          borderRadius: "0.15em",
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1, opacity: textOpacity }}>
        {word}
      </span>
    </span>
  );
};

// A single phrase: "{name} is {adjective}"
const Phrase = ({
  name,
  adjective,
  highlightColor,
}: {
  name: string;
  adjective: string;
  highlightColor: string;
}) => {
  const nameEndFrame = name.length * 3;
  const isStartFrame = nameEndFrame + 5;
  const adjectiveStartFrame = isStartFrame + 10;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          color: COLOR_TEXT,
          fontSize: FONT_SIZE,
          fontWeight: FONT_WEIGHT,
          display: "flex",
          gap: "0.3em",
        }}
      >
        <Typewriter text={name} startFrame={0} charFrames={3} />
        <FadeScale text="is" startFrame={isStartFrame} duration={8} />
        <WordHighlight
          word={adjective}
          startFrame={adjectiveStartFrame}
          duration={12}
          highlightColor={highlightColor}
        />
      </div>
    </AbsoluteFill>
  );
};

const SCENES = [
  { name: "Alex", adjective: "crunchy", color: COLORS.pink },
  { name: "Greg", adjective: "suspicious", color: COLORS.mint },
  { name: "Jon", adjective: "aerodynamic", color: COLORS.lavender },
  { name: "Rudaba", adjective: "a troll", color: COLORS.peach },
  { name: "Cayden", adjective: "radioactive", color: COLORS.sky },
];

const SCENE_DURATION = 60; // 2 seconds per scene

export const AlexIsAwesome = () => {
  return (
    <>
      {SCENES.map((scene, i) => (
        <Sequence key={scene.name} from={i * SCENE_DURATION} durationInFrames={SCENE_DURATION}>
          <Phrase
            name={scene.name}
            adjective={scene.adjective}
            highlightColor={scene.color}
          />
        </Sequence>
      ))}
    </>
  );
};
