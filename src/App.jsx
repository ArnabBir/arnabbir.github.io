import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { ThemeProvider } from 'next-themes';
import ScrollToTop from "./components/ScrollToTop";
import LibraryHome from "./pages/LibraryHome";
import LibraryRack from "./pages/LibraryRack";
import LibraryItem from "./pages/LibraryItem";
import ProjectDetail from "./pages/ProjectDetail";
import {
  AnycastLoadBalancingSimulation,
  BitcoinSimulation,
  BloomParadoxSimulation,
  BorgSimulation,
  DremelSimulation,
  DruidSimulation,
  DynamoSimulation,
  F1Simulation,
  FederatedOptimizationsSimulation,
  FlumejavaSimulation,
  GoogleSearchAnatomySimulation,
  GorillaSimulation,
  MagnetShuffleSimulation,
  MegastoreSimulation,
  MonarchSimulation,
  Myrocks1Simulation,
  MyrocksSimulation,
  NapaSimulation,
  ParallelismOptimizingDataPlacementSimulation,
  PaxosMadeLiveSimulation,
  PaxosSimpleSimulation,
  QuicSimulation,
  RelationalModelSimulation,
  ScalingPagerankSimulation,
  SpannerSimulation,
  SreCapacityManagementSimulation,
  SundialSimulation,
  ThreadPerCoreTailLatencySimulation,
  TrickleSimulation,
  TwitterWtfSimulation,
  VirtualMemorySimulation,
  WebSearchForAPlanetSimulation,
  WindowsAzureStorageSimulation,
  ZanzibarSimulation,
} from "./pages/simulations";

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
];

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to} element={page} />
            ))}
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/library" element={<LibraryHome />} />
            <Route path="/library/operating-system/virtual-memory" element={<VirtualMemorySimulation />} />
            {SIMULATION_ROUTES.map(({ path, component: Component }) => (
              <Route key={path} path={`/library/whitepapers/${path}`} element={<Component />} />
            ))}
            <Route path="/library/rack/:rackId" element={<LibraryRack />} />
            <Route path="/library/:id" element={<LibraryItem />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;