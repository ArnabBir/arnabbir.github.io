import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, Home, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import Container from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Registry of project slugs -> metadata + content path.
 * Add more entries here as you build project detail pages.
 */
const PROJECT_PAGES = {
  orator: {
    title: "Orator — Web Narrator",
    subtitle: "Technical architecture and design deep-dive",
    contentPath: "/projects/how_orator_works.html",
    tags: ["Chrome Extension", "Firefox Add-on", "Accessibility", "TTS"],
    links: [
      {
        label: "Chrome Web Store",
        href: "https://chromewebstore.google.com/detail/orator-%E2%80%94-web-narrator/becblgoenaekioaddgjgenjldaniadao",
      },
      {
        label: "Firefox Add-ons",
        href: "https://addons.mozilla.org/en-US/firefox/addon/orator-web-narrator/",
      },
    ],
  },
};

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const iframeRef = useRef(null);

  const project = PROJECT_PAGES[slug];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") navigate("/#projects");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Send theme to iframe when it changes
  useEffect(() => {
    if (iframeRef.current && project) {
      const currentTheme = resolvedTheme || theme || "light";
      try {
        iframeRef.current.contentWindow?.postMessage(
          { type: "THEME_CHANGE", theme: currentTheme },
          "*"
        );
      } catch (e) {
        // Iframe might not be ready yet
      }
    }
  }, [theme, resolvedTheme, project]);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader onOpenCommand={() => setCommandOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Project not found</h2>
            <p className="text-muted-foreground">
              We couldn't find a detail page for this project.
            </p>
            <Button asChild>
              <Link to="/#projects">Back to projects</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      {/* Breadcrumb */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="py-4">
          <div className="flex items-center justify-between gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/#projects">Projects</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="font-medium text-foreground">{project.title}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/#projects")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                ESC
              </kbd>
            </Button>
          </div>
        </Container>
      </div>

      {/* Info Banner */}
      <div className="border-b bg-muted/30">
        <Container className="py-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{project.title}</span>
            </div>
            <span>•</span>
            <span>{project.subtitle}</span>
            {project.links?.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap gap-2">
                  {project.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {l.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
          {project.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Container>
      </div>

      {/* Content */}
      <main className="flex-1 relative">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 z-20"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading content...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
          <div className="w-full">
            <iframe
              ref={iframeRef}
              src={project.contentPath}
              className="w-full border-0 bg-background"
              style={{
                minHeight: "calc(100vh - 200px)",
                display: "block",
                width: "100%",
              }}
              title={project.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => {
                setLoading(false);
                setError(null);
                const currentTheme = resolvedTheme || theme || "light";
                try {
                  iframeRef.current.contentWindow?.postMessage(
                    { type: "THEME_CHANGE", theme: currentTheme },
                    "*"
                  );
                } catch (e) {
                  // Ignore
                }
                if (iframeRef.current) {
                  setTimeout(() => {
                    try {
                      const iframeDoc =
                        iframeRef.current.contentDocument ||
                        iframeRef.current.contentWindow.document;
                      const body = iframeDoc.body;
                      const html = iframeDoc.documentElement;
                      const height = Math.max(
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight
                      );
                      iframeRef.current.style.height = `${Math.max(height, 800)}px`;
                    } catch (e) {
                      iframeRef.current.style.height = "100vh";
                    }
                  }, 500);
                }
              }}
              onError={() => {
                setError("Failed to load content.");
                setLoading(false);
              }}
            />
          </div>
        </motion.div>
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
