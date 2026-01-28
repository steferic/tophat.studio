/**
 * Asset Browser - Browse and add 3D models and primitives to the scene
 */

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../state/editorStore';
import type { SceneObject } from '../../types/scene';

// ============================================================================
// Available Assets
// ============================================================================

// Models available in public/models/
const AVAILABLE_MODELS = [
  { name: 'Apple', path: 'models/apple.glb', icon: '🍎' },
  { name: 'Bread', path: 'models/bread.glb', icon: '🍞' },
  { name: 'Burger King Computer', path: 'models/burger-king-computer.glb', icon: '🖥️' },
  { name: 'Filet-O-Fish', path: 'models/filet-o-fish.glb', icon: '🐟' },
  { name: 'ISS', path: 'models/iss.glb', icon: '🛰️' },
  { name: 'Lion Chinatown', path: 'models/lion-chinatown.glb', icon: '🦁' },
  { name: 'Rock', path: 'models/rock.glb', icon: '🪨' },
  { name: 'Rose', path: 'models/rose.glb', icon: '🌹' },
  { name: 'Tank', path: 'models/tank.glb', icon: '🎖️' },
  { name: 'Wild Things', path: 'models/wild-things.glb', icon: '👹' },
  { name: 'Zoltar', path: 'models/zoltar.glb', icon: '🔮' },
];

// Primitive shapes
const PRIMITIVES = [
  { name: 'Box', type: 'box' as const, icon: '◻️' },
  { name: 'Sphere', type: 'sphere' as const, icon: '⚪' },
  { name: 'Cylinder', type: 'cylinder' as const, icon: '🛢️' },
  { name: 'Cone', type: 'cone' as const, icon: '🔺' },
  { name: 'Torus', type: 'torus' as const, icon: '⭕' },
];

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1e1e2e',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #313244',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6c7086',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  tabActive: {
    backgroundColor: '#313244',
    color: '#cdd6f4',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  assetCard: {
    padding: 12,
    backgroundColor: '#313244',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.1s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  assetCardHover: {
    borderColor: '#89b4fa',
    backgroundColor: '#45475a',
  },
  assetIcon: {
    fontSize: 24,
  },
  assetName: {
    fontSize: 10,
    color: '#cdd6f4',
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    marginBottom: 8,
    outline: 'none',
  },
  dropZone: {
    padding: 24,
    border: '2px dashed #45475a',
    borderRadius: 8,
    textAlign: 'center',
    color: '#6c7086',
    fontSize: 12,
    marginTop: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropZoneActive: {
    borderColor: '#89b4fa',
    backgroundColor: 'rgba(137, 180, 250, 0.1)',
  },
};

// ============================================================================
// Asset Card Component
// ============================================================================

const AssetCard: React.FC<{
  icon: string;
  name: string;
  onClick: () => void;
}> = ({ icon, name, onClick }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        ...styles.assetCard,
        ...(hover ? styles.assetCardHover : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={styles.assetIcon}>{icon}</span>
      <span style={styles.assetName}>{name}</span>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

type TabType = 'models' | 'primitives';

export const AssetBrowser: React.FC = () => {
  const { addObject, selectObject } = useEditorStore();
  const [activeTab, setActiveTab] = useState<TabType>('models');
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Generate unique ID
  const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Add a model to the scene
  const handleAddModel = useCallback((model: typeof AVAILABLE_MODELS[0]) => {
    const id = generateId();
    const newObject: SceneObject = {
      id,
      name: model.name,
      type: 'model',
      modelPath: model.path,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
    };
    addObject(newObject);
    selectObject(id);
  }, [addObject, selectObject]);

  // Add a primitive to the scene
  const handleAddPrimitive = useCallback((primitive: typeof PRIMITIVES[0]) => {
    const id = generateId();
    const newObject: SceneObject = {
      id,
      name: primitive.name,
      type: 'primitive',
      primitiveType: primitive.type,
      primitiveProps: {
        color: '#6366f1',
        wireframe: false,
      },
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
    };
    addObject(newObject);
    selectObject(id);
  }, [addObject, selectObject]);

  // Handle file drop for custom models
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const glbFiles = files.filter(f => f.name.endsWith('.glb') || f.name.endsWith('.gltf'));

    if (glbFiles.length === 0) {
      alert('Please drop .glb or .gltf files');
      return;
    }

    // For now, show instructions since we can't upload to public folder at runtime
    alert(
      `To add custom models:\n\n` +
      `1. Copy your .glb/.gltf files to:\n   public/models/\n\n` +
      `2. Add the model to AVAILABLE_MODELS in:\n   src/editor/components/AssetBrowser.tsx\n\n` +
      `Files detected: ${glbFiles.map(f => f.name).join(', ')}`
    );
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Filter assets by search
  const filteredModels = AVAILABLE_MODELS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPrimitives = PRIMITIVES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'models' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('models')}
        >
          3D Models ({AVAILABLE_MODELS.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'primitives' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('primitives')}
        >
          Primitives
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Search */}
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Asset Grid */}
        <div style={styles.grid}>
          {activeTab === 'models' && filteredModels.map((model) => (
            <AssetCard
              key={model.path}
              icon={model.icon}
              name={model.name}
              onClick={() => handleAddModel(model)}
            />
          ))}

          {activeTab === 'primitives' && filteredPrimitives.map((primitive) => (
            <AssetCard
              key={primitive.type}
              icon={primitive.icon}
              name={primitive.name}
              onClick={() => handleAddPrimitive(primitive)}
            />
          ))}
        </div>

        {/* Drop zone for custom models */}
        {activeTab === 'models' && (
          <div
            style={{
              ...styles.dropZone,
              ...(isDragging ? styles.dropZoneActive : {}),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div>📁</div>
            <div style={{ marginTop: 8 }}>
              Drop .glb/.gltf files here
            </div>
            <div style={{ fontSize: 10, marginTop: 4, color: '#585b70' }}>
              or add to public/models/
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetBrowser;
