# tophat.studio

A programmatic video creation studio built with [Remotion](https://remotion.dev), React, and Three.js. Create stunning animated videos, advertisements, and mathematical visualizations entirely in code.

## Features

- **Advertisement Templates** - Ready-to-use ad templates for product launches, SaaS platforms, startups, e-commerce, and more
- **Mathematical Animations** - Beautiful visualizations including Mandelbrot sets, Lorenz attractors, Fourier series, sorting algorithms, and fluid dynamics
- **3D Graphics** - Full Three.js integration with custom components, lighting, and camera controls
- **Scene Editor** - Visual editor for composing 3D scenes with motion paths
- **Cinematic Transitions** - Smooth transitions and effects for professional-looking videos

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository (includes Git LFS for media assets)
git clone https://github.com/steferic/tophat.studio.git
cd tophat.studio

# If media files didn't download automatically, pull them with:
git lfs pull

# Install dependencies
npm install
```

> **Note**: This repo uses [Git LFS](https://git-lfs.github.com/) for large media files (3D models, audio, video). Make sure Git LFS is installed on your system.

### Development

```bash
# Start Remotion Studio (interactive preview)
npm start
```

This opens Remotion Studio at `http://localhost:3000` where you can preview and edit compositions in real-time.

### Rendering Videos

```bash
# Render a specific composition
npx remotion render <CompositionId> out/video.mp4

# Example: Render the Argyu ad
npx remotion render ArgyuAdV3 out/argyu-ad-v3.mp4

# For 3D/WebGL compositions, use the angle flag
npx remotion render ArgyuAdV3 out/argyu-ad-v3.mp4 --gl=angle --concurrency=1
```

## Project Structure

```
src/
├── ads/                    # Advertisement templates
│   ├── ProductLaunch.tsx
│   ├── SaaSPlatform.tsx
│   ├── ArgyuAdV3.tsx
│   └── ...
├── math-animations/        # Mathematical visualizations
│   ├── MandelbrotZoom.tsx
│   ├── LorenzAttractor.tsx
│   ├── FourierSeries.tsx
│   ├── BubbleSort.tsx
│   └── ...
├── three/                  # Three.js components
├── transitions/            # Cinematic transitions
├── manim/                  # Manim-style animation primitives
├── editor/                 # Visual scene editor
├── components/             # Reusable UI components
└── Root.tsx               # Composition registry
```

## Available Compositions

### Advertisements
| ID | Description | Duration |
|----|-------------|----------|
| `ProductLaunch` | Product launch announcement | 15s |
| `SaaSPlatform` | SaaS platform promo | 20s |
| `StartupStory` | Startup narrative | 25s |
| `EcommerceSale` | E-commerce sale | 12s |
| `MobileAppPromo` | Mobile app promotion | 18s |
| `CorporateEnterprise` | Enterprise B2B | 22s |
| `ProductDemo` | Product demonstration | 30s |
| `ArgyuAdV3` | Argyu debate platform ad | 25s |

### Mathematical Animations
| ID | Description |
|----|-------------|
| `MandelbrotZoom` | Fractal zoom into Mandelbrot set |
| `LorenzAttractor` | Chaotic Lorenz system visualization |
| `FourierSeries` | Fourier series approximation |
| `DoublePendulum` | Chaotic double pendulum |
| `BubbleSort` / `QuickSort` | Sorting algorithm visualizations |
| `VortexStreet` | Fluid dynamics simulation |
| `FlowField` | Perlin noise flow field |
| `CubeToSphere` | Point cloud morphing |
| `NeuralNetwork` | Neural network visualization |
| `VectorComponents` | 3D vector decomposition |

### Demos
| ID | Description |
|----|-------------|
| `TransitionDemo` | Cinematic transition showcase |
| `ModelDemo` | 3D model loading demo |
| `BeatAnalyzer` | Audio-reactive visualization |

## Customizing Compositions

Each composition accepts props that can be customized. Edit the `defaultProps` in `src/Root.tsx` or pass props when rendering:

```bash
npx remotion render ProductLaunch out/my-product.mp4 --props='{"productName":"My Product","tagline":"Amazing!"}'
```

## Tech Stack

- **[Remotion](https://remotion.dev)** - React-based video creation
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)** - Three.js for React
- **[Three.js](https://threejs.org)** - 3D graphics
- **TypeScript** - Type safety
- **Vite** - Fast development builds

## Included Assets

The repo includes media assets via Git LFS (~300MB):

**3D Models** (`public/models/`)
- apple.glb, rose.glb, rock.glb
- iss.glb (International Space Station)
- tank.glb, lion-chinatown.glb, zoltar.glb
- And more...

**Audio** (`public/audio/`)
- argyu-beat.mp3
- ravel-string-quartet.mp3

**Videos** (`public/videos/`)
- flower-abstract.mp4
- bee-portrait.mp4
- psychedelic-liquid.mp4

## Rendering Tips

- **WebGL Issues**: If you encounter WebGL context errors, use `--gl=angle` and `--concurrency=1`
- **Memory**: For long videos, reduce concurrency: `--concurrency=2`
- **Quality**: Adjust codec and quality: `--codec=h264 --crf=18`

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
