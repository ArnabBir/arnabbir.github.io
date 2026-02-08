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
            <Route path="/library/rack/:rackId" element={<LibraryRack />} />
            <Route path="/library/:id" element={<LibraryItem />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;