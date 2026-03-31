import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import CommandMenu from "@/components/CommandMenu";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import Container from "@/components/layout/Container";
import WritingCard from "@/components/writing/WritingCard";
import { writingContent } from "@/content";

export default function AllBlogs() {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="py-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link
              to="/#writing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              ← Back to Writing
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">All Writing</h1>
              <p className="text-muted-foreground">
                A collection of technical explorations, system design insights, and engineering lessons learned.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writingContent.map((w, i) => (
                <motion.div
                  key={w.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <WritingCard w={w} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </main>

      <SiteFooter />

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
