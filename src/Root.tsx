import { Composition, Folder } from "remotion";
import { AlexIsAwesome } from "./AlexIsAwesome";
import { BeatAnalyzer } from "./BeatAnalyzer";
import { TransitionDemo } from "./TransitionDemo";
import { ModelDemo } from "./ModelDemo";
import { ManimDemo } from "./ManimDemo";
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
} from "./ads";

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

      {/* Manim Demo - mathematical animations */}
      <Composition
        id="ManimDemo"
        component={ManimDemo}
        durationInFrames={1200}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
