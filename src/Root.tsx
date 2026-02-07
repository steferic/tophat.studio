import { Composition, Folder } from "remotion";
import { AlexIsAwesome } from "./AlexIsAwesome";
import { BeatAnalyzer } from "./BeatAnalyzer";
import { TransitionDemo } from "./TransitionDemo";
import { ModelDemo } from "./ModelDemo";
import { ManimDemo } from "./ManimDemo";
import { ScenePlayer } from "./player";
import { createDefaultScene } from "./types/scene";
import {
  ProductLaunch,
  SaaSPlatform,
  StartupStory,
  EcommerceSale,
  MobileAppPromo,
  CorporateEnterprise,
  ProductDemo,
  ArgyuAd,
  ArgyuAdV2,
  ArgyuAdV3,
} from "./ads";
import {
  DoubleHelix,
  FourierSeries,
  MorphingShapes,
  LissajousCurves,
  LorenzAttractor,
  PendulumWave,
  Spirograph,
  PolarRose,
  TrefoilKnot,
  AppleLorenz,
  VortexStreet,
  FlowField,
  ConvectionCells,
  FishToApple,
  CubeToSphere,
  BubbleSort,
  QuickSort,
  MandelbrotZoom,
  DoublePendulum,
  NeuralNetwork,
  VectorComponents,
  HairyBall,
  HairyBallApple,
  ThreeBody,
  YoinkySploinky,
  YoinkySploinkyV2,
} from "./math-animations";
import { CityStreet } from "./videos/CityStreet";

export const RemotionRoot = () => {
  return (
    <>
      {/* Original composition */}
      <Composition
        id="AlexIsAwesome"
        component={AlexIsAwesome}
        durationInFrames={600}
        fps={60}
        width={1280}
        height={720}
      />

      {/* Advertisement Sample Videos */}
      <Folder name="Company-Advertisements">
        {/* Ad 1: Product Launch - 15 seconds */}
        <Composition
          id="ProductLaunch"
          component={ProductLaunch}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            productName: "NOVA X1",
            tagline: "The Future is Here",
            features: ["10x Faster", "AI Powered", "Ultra Lightweight"],
            ctaText: "Pre-Order Now",
            primaryColor: "#6366f1",
            secondaryColor: "#0f0f23",
          }}
        />

        {/* Ad 2: SaaS Platform - 20 seconds */}
        <Composition
          id="SaaSPlatform"
          component={SaaSPlatform}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            companyName: "Analytica",
            tagline: "Analytics that actually make sense",
            problemStatement: "Spending hours trying to understand your data?",
            stats: [
              { value: "10K+", label: "Active Users" },
              { value: "99.9%", label: "Uptime" },
              { value: "50M+", label: "Data Points" },
            ],
            testimonial: {
              quote: "Analytica transformed how we understand our customers. We've increased retention by 40% in just 3 months.",
              author: "Sarah Chen",
              role: "VP of Product, TechStartup",
            },
            ctaText: "Get Started Free",
            primaryColor: "#6366f1",
          }}
        />

        {/* Ad 3: Startup Brand Story - 25 seconds */}
        <Composition
          id="StartupStory"
          component={StartupStory}
          durationInFrames={1500}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            companyName: "Lumina",
            foundedYear: "2019",
            hook: "What if technology could truly understand us?",
            mission: "To create technology that amplifies human potential and brings people closer together.",
            vision: "A world where everyone has access to tools that help them thrive.",
            milestones: [
              { year: "2019", event: "Founded in a small garage" },
              { year: "2020", event: "First 1,000 users" },
              { year: "2022", event: "$10M Series A" },
              { year: "2024", event: "1 million users worldwide" },
            ],
            ctaText: "Learn More",
            primaryColor: "#f59e0b",
            accentColor: "#fbbf24",
          }}
        />

        {/* Ad 4: E-commerce Flash Sale - 10 seconds */}
        <Composition
          id="EcommerceSale"
          component={EcommerceSale}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            brandName: "SOUNDWAVE",
            productName: "ProMax Headphones",
            originalPrice: 299,
            salePrice: 149,
            discount: "50% OFF",
            features: ["Active Noise Cancellation", "40hr Battery Life", "Premium Sound"],
            ctaText: "Shop Now",
            urgencyText: "Ends Tonight!",
            primaryColor: "#ef4444",
            accentColor: "#fbbf24",
          }}
        />

        {/* Ad 5: Mobile App Promo - 15 seconds */}
        <Composition
          id="MobileAppPromo"
          component={MobileAppPromo}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            appName: "Taskly",
            tagline: "Your productivity, simplified",
            features: [
              {
                icon: "📋",
                title: "Smart Task Management",
                description: "Organize your tasks with AI-powered suggestions",
              },
              {
                icon: "📊",
                title: "Progress Tracking",
                description: "Visualize your productivity with beautiful charts",
              },
              {
                icon: "🔔",
                title: "Smart Reminders",
                description: "Never miss a deadline with intelligent notifications",
              },
            ],
            rating: 4.8,
            downloads: "2M+",
            ctaText: "Download Free Today",
            primaryColor: "#8b5cf6",
          }}
        />

        {/* Ad 6: Corporate/Enterprise - 20 seconds */}
        <Composition
          id="CorporateEnterprise"
          component={CorporateEnterprise}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            companyName: "Nexus",
            tagline: "Enterprise Solutions Reimagined",
            stats: [
              { value: 99, suffix: "%", label: "Uptime SLA" },
              { value: 500, suffix: "+", label: "Enterprise Clients" },
              { value: 40, suffix: "%", label: "Cost Reduction" },
            ],
            clients: ["Fortune 500", "TechCorp", "GlobalBank", "MegaRetail"],
            globalLocations: 25,
            ctaText: "Schedule a Demo",
            primaryColor: "#3b82f6",
          }}
        />

        {/* Ad 7: Product Demo with Scrolling Screenshot - 20 seconds */}
        <Composition
          id="ProductDemo"
          component={ProductDemo}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            screenshotPath: "screenshots/linear.png",
            productName: "Linear",
            productUrl: "https://linear.app",
            tagline: "The issue tracking tool you'll enjoy using",
            features: [
              "Lightning-fast performance",
              "Beautiful, intuitive interface",
              "Powerful keyboard shortcuts",
              "Seamless Git integration",
            ],
            ctaText: "Start Free Trial",
            primaryColor: "#5E6AD2",
            accentColor: "#8B5CF6",
          }}
        />

        {/* Ad 8: Argyu - Crypto Debate Platform - 19.5 seconds */}
        <Composition
          id="ArgyuAd"
          component={ArgyuAd}
          durationInFrames={1170}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Ad 9: Argyu V2 - Alternative variation - 15 seconds */}
        <Composition
          id="ArgyuAdV2"
          component={ArgyuAdV2}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Ad 10: Argyu V3 - Classical Edition with Ravel - 25 seconds */}
        <Composition
          id="ArgyuAdV3"
          component={ArgyuAdV3}
          durationInFrames={1500}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>

      {/* Mathematical Animations */}
      <Folder name="Math-Animations">
        {/* Double Helix - 3D rotating DNA structure - 5 seconds */}
        <Composition
          id="DoubleHelix"
          component={DoubleHelix}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Fourier Series - Epicycles drawing patterns - 5 seconds */}
        <Composition
          id="FourierSeries"
          component={FourierSeries}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Morphing Shapes - Circle to polygon transitions - 5 seconds */}
        <Composition
          id="MorphingShapes"
          component={MorphingShapes}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Lissajous Curves - Parametric rainbow curves - 5 seconds */}
        <Composition
          id="LissajousCurves"
          component={LissajousCurves}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Combined Demo - All animations in sequence - 20 seconds */}
        <Composition
          id="ManimDemo"
          component={ManimDemo}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Lorenz Attractor - Chaotic butterfly system - 5 seconds */}
        <Composition
          id="LorenzAttractor"
          component={LorenzAttractor}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Pendulum Wave - Mesmerizing wave patterns - 5 seconds */}
        <Composition
          id="PendulumWave"
          component={PendulumWave}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Spirograph - Geometric drawing patterns - 5 seconds */}
        <Composition
          id="Spirograph"
          component={Spirograph}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Polar Rose - Flower-like curves - 5 seconds */}
        <Composition
          id="PolarRose"
          component={PolarRose}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Trefoil Knot - 3D mathematical knot - 5 seconds */}
        <Composition
          id="TrefoilKnot"
          component={TrefoilKnot}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Apple Lorenz - 3D Apple following Lorenz Attractor - 30 seconds */}
        <Composition
          id="AppleLorenz"
          component={AppleLorenz}
          durationInFrames={1800}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Fluid Dynamics Animations */}

        {/* Kármán Vortex Street - Vortex shedding behind cylinder - 10 seconds */}
        <Composition
          id="VortexStreet"
          component={VortexStreet}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Flow Field - Particle-based flow visualization - 10 seconds */}
        <Composition
          id="FlowField"
          component={FlowField}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Convection Cells - Rayleigh-Bénard convection - 10 seconds */}
        <Composition
          id="ConvectionCells"
          component={ConvectionCells}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Model Morph - 3D model transformation - 10 seconds */}
        <Composition
          id="ModelMorph"
          component={FishToApple}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            startModel: 'models/lion-chinatown.glb',
            endModel: 'models/tank.glb',
            startLabel: 'Chinatown Lion',
            endLabel: 'Tank',
            startColor: '#fbbf24',
            endColor: '#4d7c0f',
            title: 'Lion → Tank',
            particleCount: 8000,
          }}
        />

        {/* Cube to Sphere - Point cloud morphing - 10 seconds */}
        <Composition
          id="CubeToSphere"
          component={CubeToSphere}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Bubble Sort - Sorting algorithm visualization - 15 seconds */}
        <Composition
          id="BubbleSort"
          component={BubbleSort}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            barCount: 30,
            seed: 42,
            barColor: '#3b82f6',
            compareColor: '#fbbf24',
            swapColor: '#ef4444',
            sortedColor: '#22c55e',
            soundEnabled: true,
            minFrequency: 200,
            maxFrequency: 800,
          }}
        />

        {/* Quick Sort - Sorting algorithm visualization - 15 seconds */}
        <Composition
          id="QuickSort"
          component={QuickSort}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            barCount: 30,
            seed: 42,
            barColor: '#3b82f6',
            pivotColor: '#a855f7',
            compareColor: '#fbbf24',
            swapColor: '#ef4444',
            sortedColor: '#22c55e',
            partitionColor: '#6366f1',
            soundEnabled: true,
            minFrequency: 200,
            maxFrequency: 800,
          }}
        />

        {/* Mandelbrot Set - Fractal zoom animation - 20 seconds */}
        <Composition
          id="MandelbrotZoom"
          component={MandelbrotZoom}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            targetX: -0.743643887037151,
            targetY: 0.131825904205330,
            maxIterations: 200,
            colorPalette: 'classic',
          }}
        />

        {/* Double Pendulum - Chaos theory demonstration - 30 seconds */}
        <Composition
          id="DoublePendulum"
          component={DoublePendulum}
          durationInFrames={1800}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            length1: 200,
            length2: 200,
            mass1: 20,
            mass2: 20,
            initialAngle1: 120,
            initialAngle2: 120,
            gravity: 9.81,
            showTrail: true,
            trailLength: 500,
            color1: '#3b82f6',
            color2: '#ef4444',
            showChaosComparison: true,
          }}
        />

        {/* Neural Network - Forward propagation visualization - 20 seconds */}
        <Composition
          id="NeuralNetwork"
          component={NeuralNetwork}
          durationInFrames={1200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            layers: [4, 6, 6, 3],
            showWeights: true,
            speed: 1,
          }}
        />

        {/* Vector Components - x,y decomposition of rotating vector - 10 seconds */}
        <Composition
          id="VectorComponents"
          component={VectorComponents}
          durationInFrames={600}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            radius: 2,
            rotationsPerCycle: 2,
            xColor: '#3b82f6',
            yColor: '#22c55e',
          }}
        />

        {/* Hairy Ball Theorem - Tangent vector field on sphere - 15 seconds */}
        <Composition
          id="HairyBall"
          component={HairyBall}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            hairCount: 2000,
            sphereRadius: 5,
            hairLength: 1.5,
          }}
        />

        {/* Hairy Ball Theorem - Apple Edition with voiceover - 30 seconds */}
        <Composition
          id="HairyBallApple"
          component={HairyBallApple}
          durationInFrames={1800}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            hairCount: 3000,
            hairLength: 0.3,
            appleScale: 1.5,
          }}
        />

        {/* Three-Body Problem - Gravitational chaos - 60 seconds */}
        <Composition
          id="ThreeBody"
          component={ThreeBody}
          durationInFrames={3600}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            trailLength: 100,
            perturbation: 0.08,
            gravitationalConstant: 1,
            simulationSpeed: 3,
          }}
        />

        {/* Yoinky Sploinky - Asymptotic Dance - 27 seconds */}
        <Composition
          id="YoinkySploinky"
          component={YoinkySploinky}
          durationInFrames={1620}
          fps={60}
          width={1920}
          height={1080}
        />

        {/* Yoinky Sploinky V2 - Chaotic Bouncing Particles - 37 seconds */}
        <Composition
          id="YoinkySploinkyV2"
          component={YoinkySploinkyV2}
          durationInFrames={2210}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            particleCount: 12,
          }}
        />
      </Folder>

      {/* Utility: Beat Analyzer - analyze any audio file for beat sync */}
      <Composition
        id="BeatAnalyzer"
        component={() => (
          <BeatAnalyzer
            audioPath="audio/argyu-beat.mp3"
            threshold={0.25}
            minBeatInterval={0.15}
          />
        )}
        durationInFrames={60}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Utility: Transition Demo - showcase all transition effects */}
      <Composition
        id="TransitionDemo"
        component={TransitionDemo}
        durationInFrames={90 * 15}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Utility: Model Demo - showcase 3D models with orbiting camera */}
      <Composition
        id="ModelDemo"
        component={ModelDemo}
        durationInFrames={1140}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Scene Player - Loads and plays exported scene JSON files */}
      <Folder name="Scene-Player">
        {/* Default empty scene for testing */}
        <Composition
          id="ScenePlayerDemo"
          component={ScenePlayer}
          durationInFrames={300}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{
            scene: createDefaultScene("Demo Scene"),
            debug: true,
          }}
        />
      </Folder>

      {/* City Street Video - Diomira (Invisible Cities) */}
      <Composition
        id="CityStreet"
        component={CityStreet}
        durationInFrames={1088}
        fps={24}
        width={480}
        height={816}
      />
    </>
  );
};
