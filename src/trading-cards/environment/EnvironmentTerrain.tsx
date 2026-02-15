import React, { useMemo } from 'react';
import * as THREE from 'three';
import { simplex2D } from './noise';
import type { TerrainSettings } from './environmentTypes';

interface Props {
  settings: TerrainSettings;
  boxSize: number;
}

export const EnvironmentTerrain: React.FC<Props> = ({ settings, boxSize }) => {
  if (settings.type === 'none') return null;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(boxSize, boxSize, 128, 128);
    geo.rotateX(-Math.PI / 2);

    const amplitude = settings.elevation * 15;
    if (amplitude > 0) {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Layered octaves
        let h = simplex2D(x * 0.02, z * 0.02) * amplitude;
        h += simplex2D(x * 0.05, z * 0.05) * amplitude * 0.4;
        h += simplex2D(x * 0.12, z * 0.12) * amplitude * 0.15;
        pos.setY(i, Math.max(h, 0));
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    return geo;
  }, [boxSize, settings.elevation, settings.type]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={settings.color} roughness={0.85} flatShading />
    </mesh>
  );
};
