import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "./components/ScrollToTop";

const LibraryHome = lazy(() => import("./pages/LibraryHome"));
const LibraryRack = lazy(() => import("./pages/LibraryRack"));
const LibraryItem = lazy(() => import("./pages/LibraryItem"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const AllBlogs = lazy(() => import("./pages/AllBlogs"));

// Simulation pages — lazy loaded for code splitting
const AnycastLoadBalancingSimulation = lazy(() => import("./pages/simulations/AnycastLoadBalancingSimulation"));
const BitcoinSimulation = lazy(() => import("./pages/simulations/BitcoinSimulation"));
const BloomParadoxSimulation = lazy(() => import("./pages/simulations/BloomParadoxSimulation"));
const BorgSimulation = lazy(() => import("./pages/simulations/BorgSimulation"));
const DremelSimulation = lazy(() => import("./pages/simulations/DremelSimulation"));
const DruidSimulation = lazy(() => import("./pages/simulations/DruidSimulation"));
const DynamoSimulation = lazy(() => import("./pages/simulations/DynamoSimulation"));
const F1Simulation = lazy(() => import("./pages/simulations/F1Simulation"));
const FederatedOptimizationsSimulation = lazy(() => import("./pages/simulations/FederatedOptimizationsSimulation"));
const FlumejavaSimulation = lazy(() => import("./pages/simulations/FlumejavaSimulation"));
const GoogleSearchAnatomySimulation = lazy(() => import("./pages/simulations/GoogleSearchAnatomySimulation"));
const GorillaSimulation = lazy(() => import("./pages/simulations/GorillaSimulation"));
const IDFSymbolicSim = lazy(() => import("./pages/simulations/IDFSymbolicSim"));
const MagnetShuffleSimulation = lazy(() => import("./pages/simulations/MagnetShuffleSimulation"));
const MegastoreSimulation = lazy(() => import("./pages/simulations/MegastoreSimulation"));
const MonarchSimulation = lazy(() => import("./pages/simulations/MonarchSimulation"));
const Myrocks1Simulation = lazy(() => import("./pages/simulations/Myrocks1Simulation"));
const MyrocksSimulation = lazy(() => import("./pages/simulations/MyrocksSimulation"));
const NapaSimulation = lazy(() => import("./pages/simulations/NapaSimulation"));
const ParallelismOptimizingDataPlacementSimulation = lazy(() => import("./pages/simulations/ParallelismOptimizingDataPlacementSimulation"));
const PaxosMadeLiveSimulation = lazy(() => import("./pages/simulations/PaxosMadeLiveSimulation"));
const PaxosSimpleSimulation = lazy(() => import("./pages/simulations/PaxosSimpleSimulation"));
const QuicSimulation = lazy(() => import("./pages/simulations/QuicSimulation"));
const RelationalModelSimulation = lazy(() => import("./pages/simulations/RelationalModelSimulation"));
const ScalingPagerankSimulation = lazy(() => import("./pages/simulations/ScalingPagerankSimulation"));
const SpannerSimulation = lazy(() => import("./pages/simulations/SpannerSimulation"));
const SreCapacityManagementSimulation = lazy(() => import("./pages/simulations/SreCapacityManagementSimulation"));
const SundialSimulation = lazy(() => import("./pages/simulations/SundialSimulation"));
const ThreadPerCoreTailLatencySimulation = lazy(() => import("./pages/simulations/ThreadPerCoreTailLatencySimulation"));
const TrickleSimulation = lazy(() => import("./pages/simulations/TrickleSimulation"));
const TwitterWtfSimulation = lazy(() => import("./pages/simulations/TwitterWtfSimulation"));
const VirtualMemorySimulation = lazy(() => import("./pages/simulations/VirtualMemorySimulation"));
const WebSearchForAPlanetSimulation = lazy(() => import("./pages/simulations/WebSearchForAPlanetSimulation"));
const WindowsAzureStorageSimulation = lazy(() => import("./pages/simulations/WindowsAzureStorageSimulation"));
const ZanzibarSimulation = lazy(() => import("./pages/simulations/ZanzibarSimulation"));

const SIMULATION_ROUTES = [
  { path: "anycast-load-balancing", component: AnycastLoadBalancingSimulation },
  { path: "bitcoin", component: BitcoinSimulation },
  { path: "bloom-paradox", component: BloomParadoxSimulation },
  { path: "borg", component: BorgSimulation },
  { path: "dremel", component: DremelSimulation },
  { path: "druid", component: DruidSimulation },
  { path: "dynamo", component: DynamoSimulation },
  { path: "f1", component: F1Simulation },
  { path: "federated-optimizations", component: FederatedOptimizationsSimulation },
  { path: "flumejava", component: FlumejavaSimulation },
  { path: "google-search-anatomy", component: GoogleSearchAnatomySimulation },
  { path: "gorilla", component: GorillaSimulation },
  { path: "magnet-shuffle", component: MagnetShuffleSimulation },
  { path: "megastore", component: MegastoreSimulation },
  { path: "monarch", component: MonarchSimulation },
  { path: "myrocks1", component: Myrocks1Simulation },
  { path: "myrocks", component: MyrocksSimulation },
  { path: "napa", component: NapaSimulation },
  { path: "parallelism-optimizing-data-placement", component: ParallelismOptimizingDataPlacementSimulation },
  { path: "paxos-made-live", component: PaxosMadeLiveSimulation },
  { path: "paxos-simple", component: PaxosSimpleSimulation },
  { path: "quic", component: QuicSimulation },
  { path: "relational-model", component: RelationalModelSimulation },
  { path: "scaling-pagerank", component: ScalingPagerankSimulation },
  { path: "spanner", component: SpannerSimulation },
  { path: "sre-capacity-management", component: SreCapacityManagementSimulation },
  { path: "sundial", component: SundialSimulation },
  { path: "thread-per-core-tail-latency", component: ThreadPerCoreTailLatencySimulation },
  { path: "trickle", component: TrickleSimulation },
  { path: "twitter-wtf", component: TwitterWtfSimulation },
  { path: "virtual-memory", component: VirtualMemorySimulation },
  { path: "web-search-for-a-planet", component: WebSearchForAPlanetSimulation },
  { path: "windows-azure-storage", component: WindowsAzureStorageSimulation },
  { path: "zanzibar", component: ZanzibarSimulation },
  { path: "idf-symbolic-sim", component: IDFSymbolicSim },
];

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
              <Route path="/blogs" element={<AllBlogs />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/library" element={<LibraryHome />} />
              <Route path="/library/operating-system/virtual-memory" element={<VirtualMemorySimulation />} />
              {SIMULATION_ROUTES.map(({ path, component: Component }) => (
                <Route key={path} path={`/library/whitepapers/${path}`} element={<Component />} />
              ))}
              <Route path="/library/rack/:rackId" element={<LibraryRack />} />
              <Route path="/library/:id" element={<LibraryItem />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
