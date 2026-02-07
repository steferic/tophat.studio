/**
 * AssetLibrary - Left sidebar for browsing generated assets and adding scenes.
 * Scans public/ai/ for generated images/videos with metadata.
 * Also provides quick-add buttons for each scene type.
 */

import React, { useState } from 'react';
import { useStoryboardStore, useFilteredAssets } from '../state/storyboardStore';

const COLORS = {
  bg: '#1e1e2e',
  surface: '#181825',
  border: '#313244',
  text: '#cdd6f4',
  textDim: '#6c7086',
  accent: '#89b4fa',
  green: '#a6e3a1',
  purple: '#cba6f7',
  teal: '#94e2d5',
  peach: '#fab387',
  inputBg: '#11111b',
};

type Tab = 'add' | 'assets';

export const AssetLibrary: React.FC = () => {
  const [tab, setTab] = useState<Tab>('add');
  const [prompt, setPrompt] = useState('');

  return (
    <div style={panelStyle}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
        <TabButton label="+ Add Scene" active={tab === 'add'} onClick={() => setTab('add')} />
        <TabButton label="Assets" active={tab === 'assets'} onClick={() => setTab('assets')} />
      </div>

      {tab === 'add' ? (
        <AddScenePanel prompt={prompt} setPrompt={setPrompt} />
      ) : (
        <AssetBrowserPanel />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Add Scene panel
// ---------------------------------------------------------------------------

const AddScenePanel: React.FC<{
  prompt: string;
  setPrompt: (v: string) => void;
}> = ({ prompt, setPrompt }) => {
  const { addAIImageScene, addAIVideoScene, addVideoScene, addImageScene, addCompositionScene } =
    useStoryboardStore();

  const [srcInput, setSrcInput] = useState('');
  const [compInput, setCompInput] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AI Generation */}
      <Section title="AI Generation">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to see..."
          rows={3}
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 50,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <AddButton
            label="+ AI Image"
            color={COLORS.teal}
            disabled={!prompt.trim()}
            onClick={() => {
              addAIImageScene(prompt.trim());
              setPrompt('');
            }}
          />
          <AddButton
            label="+ AI Video"
            color={COLORS.purple}
            disabled={!prompt.trim()}
            onClick={() => {
              addAIVideoScene(prompt.trim());
              setPrompt('');
            }}
          />
        </div>
      </Section>

      {/* Existing Assets */}
      <Section title="From File">
        <input
          type="text"
          value={srcInput}
          onChange={(e) => setSrcInput(e.target.value)}
          placeholder="videos/clip.mp4 or ai/image.png"
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <AddButton
            label="+ Video"
            color={COLORS.peach}
            disabled={!srcInput.trim()}
            onClick={() => {
              addVideoScene(srcInput.trim());
              setSrcInput('');
            }}
          />
          <AddButton
            label="+ Image"
            color={COLORS.green}
            disabled={!srcInput.trim()}
            onClick={() => {
              addImageScene(srcInput.trim());
              setSrcInput('');
            }}
          />
        </div>
      </Section>

      {/* Composition */}
      <Section title="Remotion Composition">
        <input
          type="text"
          value={compInput}
          onChange={(e) => setCompInput(e.target.value)}
          placeholder="LorenzAttractor"
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <AddButton
            label="+ Composition"
            color={COLORS.accent}
            disabled={!compInput.trim()}
            onClick={() => {
              addCompositionScene(compInput.trim());
              setCompInput('');
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 6, lineHeight: 1.4 }}>
          Available: LorenzAttractor, FourierSeries, DoubleHelix, MandelbrotZoom,
          NeuralNetwork, ThreeBody, DoublePendulum, VortexStreet, FlowField...
        </div>
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Asset Browser panel
// ---------------------------------------------------------------------------

const AssetBrowserPanel: React.FC = () => {
  const assets = useFilteredAssets();
  const { assetFilter, assetSearch, setAssetFilter, setAssetSearch, addImageScene, addVideoScene } =
    useStoryboardStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Search */}
      <input
        type="text"
        value={assetSearch}
        onChange={(e) => setAssetSearch(e.target.value)}
        placeholder="Search assets..."
        style={inputStyle}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['all', 'image', 'video'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setAssetFilter(f)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${assetFilter === f ? COLORS.accent : COLORS.border}`,
              backgroundColor: assetFilter === f ? `${COLORS.accent}20` : 'transparent',
              color: assetFilter === f ? COLORS.accent : COLORS.textDim,
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      {assets.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            color: COLORS.textDim,
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {assetSearch ? 'No matching assets' : 'No generated assets yet'}
          <br />
          <span style={{ fontSize: 10 }}>
            Run: npx tsx scripts/generate.ts image "prompt"
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {assets.map((asset) => (
            <div
              key={asset.filename}
              onClick={() => {
                if (asset.type === 'video') {
                  addVideoScene(asset.path);
                } else {
                  addImageScene(asset.path);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>
                {asset.type === 'video' ? '🎬' : '🖼'}
              </span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {asset.filename}
                </div>
                {asset.meta?.prompt && (
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.textDim,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.meta.prompt}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9, color: COLORS.textDim }}>
                {asset.meta?.model ?? '?'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: COLORS.textDim,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 8,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const AddButton: React.FC<{
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      flex: 1,
      padding: '5px 8px',
      borderRadius: 6,
      border: `1px solid ${color}40`,
      backgroundColor: `${color}15`,
      color: disabled ? COLORS.textDim : color,
      fontSize: 11,
      fontWeight: 500,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    {label}
  </button>
);

const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '6px 8px',
      borderRadius: 0,
      border: 'none',
      borderBottom: `2px solid ${active ? COLORS.accent : 'transparent'}`,
      backgroundColor: 'transparent',
      color: active ? COLORS.text : COLORS.textDim,
      fontSize: 11,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  width: 260,
  backgroundColor: '#181825',
  borderRight: '1px solid #313244',
  padding: 12,
  overflowY: 'auto',
  flexShrink: 0,
  fontFamily: 'system-ui, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#11111b',
  border: '1px solid #313244',
  borderRadius: 6,
  color: '#cdd6f4',
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};
