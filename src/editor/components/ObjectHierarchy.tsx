/**
 * Object Hierarchy Panel
 *
 * Tree view of all scene objects and lights.
 * Allows selection, visibility toggle, and reordering.
 */

import React, { useCallback } from 'react';
import {
  useEditorStore,
  useSceneObjects,
  useSceneLights,
} from '../state/editorStore';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#1e1e2e',
    borderRight: '1px solid #313244',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    color: '#cdd6f4',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #313244',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 0',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    padding: '4px 16px',
    fontSize: 11,
    fontWeight: 600,
    color: '#6c7086',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  item: {
    padding: '6px 16px 6px 24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background-color 0.1s',
  },
  itemSelected: {
    backgroundColor: '#45475a',
  },
  itemHover: {
    backgroundColor: '#313244',
  },
  itemIcon: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#89b4fa',
  },
  itemName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemActions: {
    display: 'flex',
    gap: 4,
    opacity: 0,
    transition: 'opacity 0.1s',
  },
  actionButton: {
    padding: 4,
    background: 'none',
    border: 'none',
    color: '#6c7086',
    cursor: 'pointer',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    padding: '4px 8px',
    background: '#45475a',
    border: 'none',
    color: '#cdd6f4',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 12,
  },
  empty: {
    padding: '16px',
    color: '#6c7086',
    textAlign: 'center',
    fontSize: 12,
  },
};

// ============================================================================
// Icons (inline SVG)
// ============================================================================

const CubeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const SunIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export interface ObjectHierarchyProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ObjectHierarchy: React.FC<ObjectHierarchyProps> = ({
  className,
  style,
}) => {
  const objects = useSceneObjects();
  const lights = useSceneLights();
  const {
    selectedObjectId,
    selectedLightId,
    selectObject,
    selectLight,
    removeObject,
    removeLight,
    updateObject,
    addObject,
    addLight,
  } = useEditorStore();

  // Add new object
  const handleAddObject = useCallback(() => {
    const id = `obj-${Date.now()}`;
    addObject({
      id,
      name: `Object ${objects.length + 1}`,
      type: 'primitive',
      primitiveType: 'box',
      primitiveProps: { color: '#6366f1' },
      transform: {
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
    });
    selectObject(id);
  }, [addObject, objects.length, selectObject]);

  // Add new light
  const handleAddLight = useCallback(() => {
    const id = `light-${Date.now()}`;
    addLight({
      id,
      type: 'point',
      color: '#ffffff',
      intensity: 1,
      position: [0, 5, 0],
    });
    selectLight(id);
  }, [addLight, selectLight]);

  // Toggle object visibility
  const handleToggleVisibility = useCallback(
    (id: string, currentVisible: boolean) => {
      updateObject(id, { visible: !currentVisible });
    },
    [updateObject]
  );

  return (
    <div className={className} style={{ ...styles.panel, ...style }}>
      {/* Header */}
      <div style={styles.header}>
        <span>Hierarchy</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Objects Section */}
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Objects</span>
            <button style={styles.addButton} onClick={handleAddObject}>
              + Add
            </button>
          </div>

          {objects.length === 0 ? (
            <div style={styles.empty}>No objects in scene</div>
          ) : (
            objects.map((obj) => (
              <div
                key={obj.id}
                style={{
                  ...styles.item,
                  ...(obj.id === selectedObjectId ? styles.itemSelected : {}),
                }}
                onClick={() => selectObject(obj.id)}
                onMouseEnter={(e) => {
                  if (obj.id !== selectedObjectId) {
                    e.currentTarget.style.backgroundColor = '#313244';
                  }
                  const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                  if (actions) actions.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (obj.id !== selectedObjectId) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                  const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                  if (actions) actions.style.opacity = '0';
                }}
              >
                <span style={styles.itemIcon}>
                  <CubeIcon />
                </span>
                <span style={styles.itemName}>{obj.name}</span>
                <div style={styles.itemActions} data-actions>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(obj.id, obj.visible !== false);
                    }}
                    title={obj.visible !== false ? 'Hide' : 'Show'}
                  >
                    <EyeIcon visible={obj.visible !== false} />
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeObject(obj.id);
                    }}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lights Section */}
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Lights</span>
            <button style={styles.addButton} onClick={handleAddLight}>
              + Add
            </button>
          </div>

          {lights.length === 0 ? (
            <div style={styles.empty}>No lights in scene</div>
          ) : (
            lights.map((light) => (
              <div
                key={light.id}
                style={{
                  ...styles.item,
                  ...(light.id === selectedLightId ? styles.itemSelected : {}),
                }}
                onClick={() => selectLight(light.id)}
                onMouseEnter={(e) => {
                  if (light.id !== selectedLightId) {
                    e.currentTarget.style.backgroundColor = '#313244';
                  }
                  const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                  if (actions) actions.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (light.id !== selectedLightId) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                  const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                  if (actions) actions.style.opacity = '0';
                }}
              >
                <span style={{ ...styles.itemIcon, color: light.color }}>
                  <SunIcon />
                </span>
                <span style={styles.itemName}>
                  {light.type.charAt(0).toUpperCase() + light.type.slice(1)} Light
                </span>
                <div style={styles.itemActions} data-actions>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLight(light.id);
                    }}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectHierarchy;
