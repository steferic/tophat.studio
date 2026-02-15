import React, { useState, useCallback, useEffect } from 'react';
import { getAllPresets } from '../workshop/presetStorage';
import {
  getAllEnvironmentConfigs,
  saveEnvironmentConfig,
  deleteEnvironmentConfig,
  exportEnvironmentJSON,
} from './environmentStorage';
import { EnvironmentPanel } from './EnvironmentPanel';
import { EnvironmentViewport } from './EnvironmentViewport';
import type { WorkshopPreset } from '../workshop/presetTypes';
import type {
  PlacedModel,
  FloorSettings,
  WallSettings,
  SkySettings,
  TerrainSettings,
  WaterSettings,
  WeatherSettings,
  CloudSettings,
  GodRaysSettings,
  EnvironmentConfig,
} from './environmentTypes';
import {
  DEFAULT_BOX_SIZE,
  DEFAULT_BOX_HEIGHT,
  DEFAULT_FLOOR,
  DEFAULT_WALLS,
  DEFAULT_SKY,
  DEFAULT_TERRAIN,
  DEFAULT_WATER,
  DEFAULT_WEATHER,
  DEFAULT_CLOUDS,
  DEFAULT_GOD_RAYS,
  createPlacedModel,
} from './environmentTypes';

export const Environment: React.FC = () => {
  const [placedModels, setPlacedModels] = useState<PlacedModel[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [boxSize] = useState(DEFAULT_BOX_SIZE);
  const [boxHeight] = useState(DEFAULT_BOX_HEIGHT);
  const [floor, setFloor] = useState<FloorSettings>({ ...DEFAULT_FLOOR });
  const [walls, setWalls] = useState<WallSettings>({ ...DEFAULT_WALLS });
  const [sky, setSky] = useState<SkySettings>({ ...DEFAULT_SKY });
  const [terrain, setTerrain] = useState<TerrainSettings>({ ...DEFAULT_TERRAIN });
  const [water, setWater] = useState<WaterSettings>({ ...DEFAULT_WATER });
  const [weather, setWeather] = useState<WeatherSettings>({ ...DEFAULT_WEATHER });
  const [clouds, setClouds] = useState<CloudSettings>({ ...DEFAULT_CLOUDS });
  const [godRays, setGodRays] = useState<GodRaysSettings>({ ...DEFAULT_GOD_RAYS });
  const [configs, setConfigs] = useState<EnvironmentConfig[]>(() => getAllEnvironmentConfigs());
  const [workshopPresets, setWorkshopPresets] = useState<WorkshopPreset[]>(() => getAllPresets());

  // Refresh workshop presets when tab mounts (they may have changed in Workshop)
  useEffect(() => {
    setWorkshopPresets(getAllPresets());
  }, []);

  // ── Handlers ──────────────────────────────────────────────

  const handleAddModel = useCallback((modelId: string) => {
    const model = createPlacedModel(modelId);
    setPlacedModels((prev) => [...prev, model]);
    setSelectedInstanceId(model.instanceId);
  }, []);

  const handleRemoveModel = useCallback((instanceId: string) => {
    setPlacedModels((prev) => prev.filter((m) => m.instanceId !== instanceId));
    setSelectedInstanceId((prev) => (prev === instanceId ? null : prev));
  }, []);

  const handleSelectModel = useCallback((instanceId: string | null) => {
    setSelectedInstanceId(instanceId);
  }, []);

  const handleUpdateTransform = useCallback((instanceId: string, field: string, value: number) => {
    setPlacedModels((prev) =>
      prev.map((m) => {
        if (m.instanceId !== instanceId) return m;
        switch (field) {
          case 'posX':
            return { ...m, position: [value, m.position[1], m.position[2]] };
          case 'posY':
            return { ...m, position: [m.position[0], value, m.position[2]] };
          case 'posZ':
            return { ...m, position: [m.position[0], m.position[1], value] };
          case 'rotY':
            return { ...m, rotation: [m.rotation[0], value, m.rotation[2]] };
          case 'scale':
            return { ...m, scale: value };
          default:
            return m;
        }
      }),
    );
  }, []);

  const handleApplyPreset = useCallback(
    (instanceId: string, presetId: string) => {
      const preset = workshopPresets.find((p) => p.id === presetId);
      if (!preset) return;
      setPlacedModels((prev) =>
        prev.map((m) =>
          m.instanceId === instanceId
            ? { ...m, presetId: preset.id, presetConfig: { ...preset.config } }
            : m,
        ),
      );
    },
    [workshopPresets],
  );

  const handleClearPreset = useCallback((instanceId: string) => {
    setPlacedModels((prev) =>
      prev.map((m) =>
        m.instanceId === instanceId
          ? { ...m, presetId: null, presetConfig: null }
          : m,
      ),
    );
  }, []);


  const handleUpdateFloor = useCallback((update: Partial<FloorSettings>) => {
    setFloor((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateWalls = useCallback((update: Partial<WallSettings>) => {
    setWalls((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateSky = useCallback((update: Partial<SkySettings>) => {
    setSky((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateTerrain = useCallback((update: Partial<TerrainSettings>) => {
    setTerrain((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateWater = useCallback((update: Partial<WaterSettings>) => {
    setWater((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateWeather = useCallback((update: Partial<WeatherSettings>) => {
    setWeather((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateClouds = useCallback((update: Partial<CloudSettings>) => {
    setClouds((prev) => ({ ...prev, ...update }));
  }, []);

  const handleUpdateGodRays = useCallback((update: Partial<GodRaysSettings>) => {
    setGodRays((prev) => ({ ...prev, ...update }));
  }, []);

  const handleSaveConfig = useCallback(
    (name: string) => {
      const config: EnvironmentConfig = {
        version: 2,
        id: crypto.randomUUID(),
        name,
        savedAt: Date.now(),
        boxSize,
        boxHeight,
        floor: { ...floor },
        walls: { ...walls },
        sky: { ...sky },
        terrain: { ...terrain },
        water: { ...water },
        weather: { ...weather },
        clouds: { ...clouds },
        godRays: { ...godRays },
        models: placedModels.map((m) => ({ ...m })),
      };
      saveEnvironmentConfig(config);
      setConfigs(getAllEnvironmentConfigs());
    },
    [boxSize, boxHeight, floor, walls, sky, terrain, water, weather, clouds, godRays, placedModels],
  );

  const handleLoadConfig = useCallback((id: string) => {
    const config = getAllEnvironmentConfigs().find((c) => c.id === id);
    if (!config) return;
    setPlacedModels(config.models.map((m) => ({ ...m })));
    setFloor({ ...config.floor });
    setWalls({ ...config.walls });
    setSky({ ...config.sky });
    setTerrain({ ...config.terrain });
    setWater({ ...config.water });
    setWeather({ ...config.weather });
    if (config.clouds) setClouds({ ...config.clouds });
    setGodRays({ ...config.godRays });
    setSelectedInstanceId(null);
  }, []);

  const handleDeleteConfig = useCallback((id: string) => {
    deleteEnvironmentConfig(id);
    setConfigs(getAllEnvironmentConfigs());
  }, []);

  const handleCopyConfigJSON = useCallback((id: string) => {
    const json = exportEnvironmentJSON(id);
    navigator.clipboard.writeText(json);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <EnvironmentPanel
        models={placedModels}
        selectedInstanceId={selectedInstanceId}
        boxSize={boxSize}
        boxHeight={boxHeight}
        floor={floor}
        walls={walls}
        sky={sky}
        terrain={terrain}
        water={water}
        weather={weather}
        clouds={clouds}
        godRays={godRays}
        configs={configs}
        workshopPresets={workshopPresets}
        onAddModel={handleAddModel}
        onRemoveModel={handleRemoveModel}
        onSelectModel={handleSelectModel}
        onUpdateTransform={handleUpdateTransform}
        onApplyPreset={handleApplyPreset}
        onClearPreset={handleClearPreset}
        onUpdateFloor={handleUpdateFloor}
        onUpdateWalls={handleUpdateWalls}
        onUpdateSky={handleUpdateSky}
        onUpdateTerrain={handleUpdateTerrain}
        onUpdateWater={handleUpdateWater}
        onUpdateWeather={handleUpdateWeather}
        onUpdateClouds={handleUpdateClouds}
        onUpdateGodRays={handleUpdateGodRays}
        onSaveConfig={handleSaveConfig}
        onLoadConfig={handleLoadConfig}
        onDeleteConfig={handleDeleteConfig}
        onCopyConfigJSON={handleCopyConfigJSON}
      />

      {/* Spacer for panel width */}
      <div style={{ width: 320, flexShrink: 0 }} />

      <EnvironmentViewport
        boxSize={boxSize}
        boxHeight={boxHeight}
        floor={floor}
        walls={walls}
        sky={sky}
        terrain={terrain}
        water={water}
        weather={weather}
        clouds={clouds}
        godRays={godRays}
        models={placedModels}
        selectedInstanceId={selectedInstanceId}
        onSelectModel={handleSelectModel}
      />
    </div>
  );
};
