import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { resolvePaperChapter } from '@/content/whitepapers';
import { ArrowLeft, BookOpen, Home, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
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
  const resolvedPaperPath = id === 'whitepapers' ? resolvePaperChapter(searchParams.get('chapter')) : null;
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
    if (iframeRef.current && libraryItem && libraryItem.supportsThemeMessaging !== false) {
      const currentTheme = resolvedTheme || theme || "light";
      try {
        if (!Array.from(iframeRef.current.contentDocument?.scripts || []).some(script => script.textContent.includes("THEME_CHANGE"))) return;
        iframeRef.current.contentWindow?.postMessage(
          { type: "THEME_CHANGE", theme: currentTheme },
          window.location.origin
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
    setLoading(true);
    setError(null);
    if (!libraryItem) {
      setError("Library item not found");
      setLoading(false);
      return;
    }
    // Loading state will be handled by iframe onLoad/onError events
  }, [libraryItem, activeContentPath]);

  // Scroll to top when chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterIndex, id]);

  useEffect(() => {
    // Standalone HTML needs a document navigation, not a React Router transition.
    if (resolvedPaperPath?.endsWith('.html')) window.location.replace(resolvedPaperPath);
  }, [resolvedPaperPath]);

  if (id === 'whitepapers') {
    if (resolvedPaperPath?.endsWith('.html')) return <main className="p-8" aria-busy="true">Opening paper... <a className="underline" href={resolvedPaperPath}>Open directly</a></main>;
    return <Navigate replace to={resolvedPaperPath || '/library/rack/whitepapers'} />;
  }

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
          <div className="flex flex-wrap items-center justify-between gap-4">
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
      <Container className="py-5 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">{activeTitle}</h1>
        <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">{libraryItem.description}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button asChild className="gap-2"><a href={activeContentPath} target="_blank" rel="noopener noreferrer">Open full page <ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> (new tab)</span></a></Button>
          {libraryItem.sourceUrl && <a href={libraryItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">Source collection<span className="sr-only"> (new tab)</span></a>}
        </div>
        {libraryItem.collection && <p className="text-xs leading-relaxed text-muted-foreground">{libraryItem.format} · {libraryItem.readerNote || "Original HTML edition. Use its own reading and theme controls. Where supported, progress is saved in this browser and shared with the full-page view. Companion downloads mentioned in the original text are not bundled here."}</p>}
      </Container>
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
                   height: "80dvh",
                   minHeight: "360px",
                  display: "block",
                  width: "100%",
                }}
                title={activeTitle}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
                onLoad={() => {
                  setLoading(false);
                  setError(null);
                  
                  // Send initial theme to iframe
                  const currentTheme = resolvedTheme || theme || "light";
                  try {
                    if (libraryItem.supportsThemeMessaging !== false && Array.from(iframeRef.current.contentDocument?.scripts || []).some(script => script.textContent.includes("THEME_CHANGE"))) iframeRef.current.contentWindow?.postMessage(
                      { type: "THEME_CHANGE", theme: currentTheme },
                      window.location.origin
                    );
                  } catch (e) {
                    // Ignore
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
