import React, { useMemo } from 'react';
import { Sky, Stars } from '@react-three/drei';
import type { SkySettings, SkyPreset } from './environmentTypes';

const PRESET_SUN: Record<Exclude<SkyPreset, 'custom'>, [number, number]> = {
  noon: [80, 180],
  sunset: [5, 270],
  dawn: [10, 90],
  night: [-10, 180],
};

function sunPosition(elevation: number, azimuth: number): [number, number, number] {
  const elRad = (elevation * Math.PI) / 180;
  const azRad = (azimuth * Math.PI) / 180;
  const r = 450;
  return [
    r * Math.cos(elRad) * Math.sin(azRad),
    r * Math.sin(elRad),
    r * Math.cos(elRad) * Math.cos(azRad),
  ];
}

interface Props {
  settings: SkySettings;
}

export const EnvironmentSky: React.FC<Props> = ({ settings }) => {
  if (!settings.enabled) return null;

  const pos = useMemo(() => {
    if (settings.preset === 'custom') {
      return sunPosition(settings.sunElevation, settings.sunAzimuth);
    }
    const [el, az] = PRESET_SUN[settings.preset];
    return sunPosition(el, az);
  }, [settings.preset, settings.sunElevation, settings.sunAzimuth]);

  return (
    <>
      <Sky sunPosition={pos} />
      {settings.stars && (
        <Stars radius={400} depth={60} count={settings.starCount} factor={4} fade speed={1} />
      )}
    </>
  );
};
