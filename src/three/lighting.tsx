import React from 'react';

interface StudioLightingProps {
  intensity?: number;
}

/**
 * Standard studio lighting setup - good for most 3D objects
 */
export const StudioLighting: React.FC<StudioLightingProps> = ({
  intensity = 1,
}) => {
  return (
    <>
      <ambientLight intensity={0.4 * intensity} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8 * intensity}
        castShadow
      />
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.3 * intensity}
        color="#a0a0ff"
      />
      <pointLight position={[0, -3, 0]} intensity={0.2 * intensity} color="#ffaa00" />
    </>
  );
};

interface DramaticLightingProps {
  mainColor?: string;
  fillColor?: string;
  intensity?: number;
}

/**
 * Dramatic lighting with strong contrasts - good for product shots
 */
export const DramaticLighting: React.FC<DramaticLightingProps> = ({
  mainColor = '#ffffff',
  fillColor = '#4040ff',
  intensity = 1,
}) => {
  return (
    <>
      <ambientLight intensity={0.1 * intensity} />
      <spotLight
        position={[5, 8, 5]}
        intensity={1.5 * intensity}
        color={mainColor}
        angle={0.4}
        penumbra={0.5}
        castShadow
      />
      <pointLight
        position={[-5, 2, -3]}
        intensity={0.5 * intensity}
        color={fillColor}
      />
    </>
  );
};

interface NeonLightingProps {
  color1?: string;
  color2?: string;
  intensity?: number;
}

/**
 * Neon/cyberpunk style lighting
 */
export const NeonLighting: React.FC<NeonLightingProps> = ({
  color1 = '#ff0080',
  color2 = '#00ffff',
  intensity = 1,
}) => {
  return (
    <>
      <ambientLight intensity={0.05 * intensity} />
      <pointLight position={[-4, 2, 2]} intensity={2 * intensity} color={color1} />
      <pointLight position={[4, 2, -2]} intensity={2 * intensity} color={color2} />
      <pointLight position={[0, -3, 0]} intensity={0.5 * intensity} color="#ffffff" />
    </>
  );
};
