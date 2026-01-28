/**
 * Properties Panel
 *
 * Edit properties of selected object or light.
 * Includes transform controls and motion path assignment.
 */

import React, { useCallback } from 'react';
import {
  useEditorStore,
  useSelectedObject,
  useSelectedLight,
} from '../state/editorStore';
import { getPathConfigs } from '../../motion/PathRegistry';
import type { Transform, MotionConfig, PathType, LoopMode } from '../../types/scene';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#1e1e2e',
    borderLeft: '1px solid #313244',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    color: '#cdd6f4',
    width: 300,
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #313244',
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6c7086',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 12,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    width: 80,
    fontSize: 12,
    color: '#a6adc8',
  },
  input: {
    flex: 1,
    padding: '6px 8px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    outline: 'none',
  },
  vector3: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  vectorInput: {
    flex: 1,
    padding: '6px 4px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    textAlign: 'center',
    outline: 'none',
    width: 50,
  },
  vectorLabel: {
    fontSize: 10,
    color: '#6c7086',
    marginBottom: 2,
  },
  select: {
    flex: 1,
    padding: '6px 8px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  },
  colorInput: {
    width: 32,
    height: 32,
    padding: 0,
    border: '1px solid #45475a',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#45475a',
    border: 'none',
    borderRadius: 4,
    color: '#cdd6f4',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
  },
  empty: {
    padding: 24,
    color: '#6c7086',
    textAlign: 'center',
  },
};

// ============================================================================
// Vector3 Input Component
// ============================================================================

const Vector3Input: React.FC<{
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  step?: number;
  labels?: [string, string, string];
}> = ({ value, onChange, step = 0.1, labels = ['X', 'Y', 'Z'] }) => {
  const handleChange = (index: number, newValue: string) => {
    const num = parseFloat(newValue) || 0;
    const newVector: [number, number, number] = [...value];
    newVector[index] = num;
    onChange(newVector);
  };

  return (
    <div style={styles.vector3}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div style={styles.vectorLabel}>{labels[i]}</div>
          <input
            type="number"
            style={styles.vectorInput}
            value={value[i].toFixed(2)}
            onChange={(e) => handleChange(i, e.target.value)}
            step={step}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Object Properties
// ============================================================================

const ObjectProperties: React.FC = () => {
  const object = useSelectedObject();
  const { updateObject, updateObjectTransform, setObjectMotion } = useEditorStore();
  const pathConfigs = getPathConfigs();

  if (!object) return null;

  const handleNameChange = (name: string) => {
    updateObject(object.id, { name });
  };

  const handleTransformChange = (key: keyof Transform, value: [number, number, number]) => {
    updateObjectTransform(object.id, { [key]: value });
  };

  const handleAddMotion = () => {
    const defaultMotion: MotionConfig = {
      pathType: 'circular',
      pathParams: {},
      speed: 1,
      progressOffset: 0,
      loop: 'loop',
      modifiers: [],
    };
    setObjectMotion(object.id, defaultMotion);
  };

  const handleRemoveMotion = () => {
    setObjectMotion(object.id, null);
  };

  const handleMotionChange = (updates: Partial<MotionConfig>) => {
    if (object.motion) {
      setObjectMotion(object.id, { ...object.motion, ...updates });
    }
  };

  return (
    <>
      {/* Name */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Object</div>
        <div style={styles.row}>
          <span style={styles.label}>Name</span>
          <input
            type="text"
            style={styles.input}
            value={object.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>
      </div>

      {/* Transform */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Transform</div>

        <div style={styles.row}>
          <span style={styles.label}>Position</span>
          <Vector3Input
            value={object.transform.position}
            onChange={(v) => handleTransformChange('position', v)}
          />
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Rotation</span>
          <Vector3Input
            value={object.transform.rotation.map((r) => (r * 180) / Math.PI) as [number, number, number]}
            onChange={(v) =>
              handleTransformChange(
                'rotation',
                v.map((r) => (r * Math.PI) / 180) as [number, number, number]
              )
            }
            step={15}
          />
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Scale</span>
          <Vector3Input
            value={object.transform.scale}
            onChange={(v) => handleTransformChange('scale', v)}
          />
        </div>
      </div>

      {/* Motion */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Motion</div>

        {object.motion ? (
          <>
            <div style={styles.row}>
              <span style={styles.label}>Path</span>
              <select
                style={styles.select}
                value={object.motion.pathType}
                onChange={(e) =>
                  handleMotionChange({ pathType: e.target.value as PathType })
                }
              >
                {pathConfigs.map((config) => (
                  <option key={config.type} value={config.type}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.row}>
              <span style={styles.label}>Speed</span>
              <input
                type="number"
                style={styles.input}
                value={object.motion.speed}
                onChange={(e) =>
                  handleMotionChange({ speed: parseFloat(e.target.value) || 1 })
                }
                step={0.1}
                min={0.1}
              />
            </div>

            <div style={styles.row}>
              <span style={styles.label}>Loop</span>
              <select
                style={styles.select}
                value={object.motion.loop}
                onChange={(e) =>
                  handleMotionChange({ loop: e.target.value as LoopMode })
                }
              >
                <option value="none">None</option>
                <option value="loop">Loop</option>
                <option value="pingpong">Ping-Pong</option>
              </select>
            </div>

            <div style={styles.row}>
              <span style={styles.label}>Offset</span>
              <input
                type="number"
                style={styles.input}
                value={object.motion.progressOffset}
                onChange={(e) =>
                  handleMotionChange({
                    progressOffset: parseFloat(e.target.value) || 0,
                  })
                }
                step={0.1}
                min={0}
                max={1}
              />
            </div>

            <button
              style={{ ...styles.button }}
              onClick={handleRemoveMotion}
            >
              Remove Motion
            </button>
          </>
        ) : (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleAddMotion}
          >
            Add Motion Path
          </button>
        )}
      </div>
    </>
  );
};

// ============================================================================
// Light Properties
// ============================================================================

const LightProperties: React.FC = () => {
  const light = useSelectedLight();
  const { updateLight } = useEditorStore();

  if (!light) return null;

  const handleChange = (key: string, value: any) => {
    updateLight(light.id, { [key]: value });
  };

  return (
    <>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Light</div>

        <div style={styles.row}>
          <span style={styles.label}>Type</span>
          <select
            style={styles.select}
            value={light.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="ambient">Ambient</option>
            <option value="directional">Directional</option>
            <option value="point">Point</option>
            <option value="spot">Spot</option>
          </select>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Color</span>
          <input
            type="color"
            style={styles.colorInput}
            value={light.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
          <input
            type="text"
            style={{ ...styles.input, flex: 1 }}
            value={light.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Intensity</span>
          <input
            type="number"
            style={styles.input}
            value={light.intensity}
            onChange={(e) =>
              handleChange('intensity', parseFloat(e.target.value) || 0)
            }
            step={0.1}
            min={0}
          />
        </div>

        {(light.type === 'point' || light.type === 'spot' || light.type === 'directional') && (
          <div style={styles.row}>
            <span style={styles.label}>Position</span>
            <Vector3Input
              value={(light.position || [0, 5, 0]) as [number, number, number]}
              onChange={(v) => handleChange('position', v)}
            />
          </div>
        )}

        {light.type === 'spot' && (
          <>
            <div style={styles.row}>
              <span style={styles.label}>Angle</span>
              <input
                type="number"
                style={styles.input}
                value={((light.angle || Math.PI / 4) * 180) / Math.PI}
                onChange={(e) =>
                  handleChange(
                    'angle',
                    ((parseFloat(e.target.value) || 45) * Math.PI) / 180
                  )
                }
                step={5}
                min={0}
                max={180}
              />
            </div>

            <div style={styles.row}>
              <span style={styles.label}>Penumbra</span>
              <input
                type="number"
                style={styles.input}
                value={light.penumbra || 0.5}
                onChange={(e) =>
                  handleChange('penumbra', parseFloat(e.target.value) || 0)
                }
                step={0.1}
                min={0}
                max={1}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface PropertiesPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  className,
  style,
}) => {
  const { selectedObjectId, selectedLightId } = useEditorStore();

  const hasSelection = selectedObjectId || selectedLightId;

  return (
    <div className={className} style={{ ...styles.panel, ...style }}>
      <div style={styles.header}>Properties</div>

      <div style={styles.content}>
        {!hasSelection ? (
          <div style={styles.empty}>
            Select an object or light to edit its properties
          </div>
        ) : (
          <>
            {selectedObjectId && <ObjectProperties />}
            {selectedLightId && <LightProperties />}
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
