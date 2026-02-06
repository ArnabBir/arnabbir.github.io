import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";

import Container from "@/components/layout/Container";
import SocialIcon from "@/components/icons/SocialIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteContent } from "@/content";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.06] dark:opacity-[0.08]" />
        <div className="absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-cyan-400/20 to-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-44 right-[-20%] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-fuchsia-400/20 via-primary/20 to-cyan-400/20 blur-3xl" />
      </div>

      <Container className="py-14 sm:py-20" id="content">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Distributed Systems</Badge>
              <Badge variant="secondary">Reliability</Badge>
              <Badge variant="secondary">Platform Engineering</Badge>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Hi, I’m <span className="text-gradient">{siteContent.name}</span>.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {siteContent.tagline}
            </p>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              {siteContent.summary}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button asChild className="group">
                <a href="#projects">
                  View projects
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              {siteContent.resumeUrl ? (
                <Button asChild variant="secondary" className="group">
                  <a href={siteContent.resumeUrl} target="_blank" rel="noopener noreferrer">
                    Download resume
                    <Download className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="ghost">
                <a href="#contact">Let’s talk</a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {siteContent.socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                >
                  <SocialIcon name={s.icon} className="h-4 w-4" />
                  {s.label}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div aria-hidden="true" className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/30 via-cyan-400/10 to-emerald-400/20 blur-2xl" />
              <div className="relative rounded-3xl border bg-card shadow-lg p-4">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/arnab-bir-profile.jpg"
                    alt={siteContent.name}
                    className="h-[320px] w-[320px] object-cover sm:h-[360px] sm:w-[360px]"
                    loading="eager"
                  />
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium">{siteContent.role}</div>
                  <div className="text-sm text-muted-foreground">{siteContent.location}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
