import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Home, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Container from "@/components/layout/Container";
import { libraryContent } from "@/content";

export default function LibraryItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const iframeRef = useRef(null);

  // Find the library item
  const libraryItem = libraryContent.find((item) => item.id === id);

  const searchParams = new URLSearchParams(location.search);
  const chapterParam = parseInt(searchParams.get("chapter") || "", 10);
  const chapterIndex = Number.isFinite(chapterParam) ? chapterParam - 1 : null;
  const rawChapter =
    libraryItem && chapterIndex !== null && libraryItem.chapters?.[chapterIndex]
      ? libraryItem.chapters[chapterIndex]
      : null;
  const chapterTitle =
    rawChapter && typeof rawChapter === "string" ? rawChapter : rawChapter?.title;
  const chapterContentPath =
    rawChapter && typeof rawChapter === "object" && rawChapter.contentPath
      ? rawChapter.contentPath
      : null;

  const activeTitle = chapterTitle || libraryItem?.title || "";
  const activeContentPath = chapterContentPath || libraryItem?.contentPath || "";
  const appendixMatch = chapterTitle?.match(/^Appendix\s+([A-Z])/i);
  const chapterLabel =
    chapterIndex !== null && chapterTitle
      ? appendixMatch
        ? `Appendix ${appendixMatch[1]}`
        : `Chapter ${String(chapterIndex + 1).padStart(2, "0")}`
      : "";
  const readingLabel =
    libraryItem?.readingTime && /chapter/i.test(libraryItem.readingTime)
      ? libraryItem.readingTime
      : libraryItem?.readingTime
      ? `${libraryItem.readingTime} read`
      : "";

  // Send theme to iframe when it changes
  useEffect(() => {
    if (iframeRef.current && libraryItem) {
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
  }, [theme, resolvedTheme, libraryItem]);

  const handleBackToLibrary = () => {
    navigate("/library");
  };

  useEffect(() => {
    // Keyboard shortcut: Escape to go back
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleBackToLibrary();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (!libraryItem) {
      setError("Library item not found");
      setLoading(false);
      return;
    }
    // Loading state will be handled by iframe onLoad/onError events
  }, [libraryItem]);

  // Scroll to top when chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterIndex, id]);

  if (!libraryItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              The library item you're looking for doesn't exist.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <Link to="/#library">Back to Library</Link>
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      {/* Breadcrumb Navigation */}
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
                  <Link to="/library">Library</Link>
                </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="font-medium text-foreground">{activeTitle}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToLibrary}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                ESC
              </kbd>
            </Button>
          </div>
        </Container>
      </div>

      {/* Content Area */}
      <main className="flex-1 relative">
        {/* Loading Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading study material...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8 z-10"
          >
            <Container>
              <Alert variant="destructive" className="max-w-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Content</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => window.location.reload()}>Retry</Button>
                <Button variant="outline" onClick={handleBackToLibrary}>
                  Back to Library
                </Button>
              </div>
            </Container>
          </motion.div>
        )}

        {/* Content */}
        {libraryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            {/* Info Banner */}
            <div className="border-b bg-muted/30">
              <Container className="py-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">{libraryItem.category}</span>
                  </div>
                  {chapterLabel && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{chapterLabel}</span>
                    </>
                  )}
                  {readingLabel && (
                    <>
                      <span>•</span>
                      <span>{readingLabel}</span>
                    </>
                  )}
                  {libraryItem.difficulty && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{libraryItem.difficulty}</span>
                    </>
                  )}
                </div>
              </Container>
            </div>

            {/* HTML Content in iframe */}
            <div className="w-full">
              <iframe
                ref={iframeRef}
                src={activeContentPath}
                className="w-full border-0 bg-background"
                style={{
                  minHeight: "calc(100vh - 200px)",
                  display: "block",
                  width: "100%",
                }}
                title={activeTitle}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onLoad={() => {
                  setLoading(false);
                  setError(null);
                  
                  // Send initial theme to iframe
                  const currentTheme = resolvedTheme || theme || "light";
                  try {
                    iframeRef.current.contentWindow?.postMessage(
                      { type: "THEME_CHANGE", theme: currentTheme },
                      "*"
                    );
                  } catch (e) {
                    // Ignore
                  }
                  
                  // Adjust height after load
                  if (iframeRef.current) {
                    setTimeout(() => {
                      try {
                        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
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
                  setError("Failed to load content. Please check the console for details.");
                  setLoading(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
