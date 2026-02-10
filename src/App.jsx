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
import VirtualMemorySimulation from "./pages/VirtualMemorySimulation";
import SpannerSimulation from "./pages/SpannerSimulation";
import BorgSimulation from "./pages/BorgSimulation";
import DremelSimulation from "./pages/DremelSimulation";

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
            <Route path="/library/whitepapers/spanner" element={<SpannerSimulation />} />
            <Route path="/library/whitepapers/borg" element={<BorgSimulation />} />
            <Route path="/library/whitepapers/dremel" element={<DremelSimulation />} />
            <Route path="/library/rack/:rackId" element={<LibraryRack />} />
            <Route path="/library/:id" element={<LibraryItem />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;