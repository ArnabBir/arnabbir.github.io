import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, MapPin, Sparkles } from "lucide-react";

import Container from "@/components/layout/Container";
import SocialIcon from "@/components/icons/SocialIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteContent } from "@/content";

const ROLES = ["Software Engineer", "Systems Thinker", "Platform Builder", "Reliability Advocate"];

function useTypingEffect(words, reduceMotion, typingSpeed = 80, deletingSpeed = 50, pauseDuration = 2000) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setText(words[0]);
      return undefined;
    }
    const currentWord = words[wordIndex];
    const atEnd = !isDeleting && text === currentWord;

    const timeout = setTimeout(
      () => {
        if (atEnd) {
          setIsDeleting(true);
        } else if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text.length === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      atEnd ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [text, isDeleting, wordIndex, words, reduceMotion, typingSpeed, deletingSpeed, pauseDuration]);

  return reduceMotion ? words[0] : text;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function Hero() {
  const reduceMotion = useReducedMotion();

  const typedRole = useTypingEffect(ROLES, reduceMotion);

  return (
    <section id="home" className="relative isolate flex min-h-[min(820px,90svh)] items-center overflow-hidden border-b border-border/60">
      {/* Animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.4] dark:opacity-[0.15] mask-fade-y" />

        {/* Gradient orbs */}
        <motion.div
          className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/25 via-violet-500/15 to-transparent blur-3xl animate-pulse-glow"
        />
        <motion.div
          className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-3xl animate-float-slow"
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 h-[350px] w-[350px] rounded-full bg-gradient-to-r from-fuchsia-400/15 via-pink-500/10 to-transparent blur-3xl animate-float-reverse"
        />

        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />
      </div>

      <Container className="py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-16">
          {/* Left Column: Text */}
          <div className="min-w-0">
            {/* Status pill */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400 backdrop-blur-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Open to opportunities
            </motion.div>

            {/* Name */}
            <motion.h1
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-[clamp(3.5rem,7.5vw,7rem)] font-bold tracking-[-0.065em] leading-[0.98]"
            >
              <span className="mb-3 block text-base font-medium tracking-normal text-muted-foreground">Hi, I'm</span>
              <span className="text-gradient">{siteContent.name}</span>
              <span className="text-primary">.</span>
            </motion.h1>

            {/* Typing role */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-6 flex min-h-7 items-center gap-2 text-base sm:text-lg text-muted-foreground"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-primary/60" />
              <span className="sr-only">{siteContent.role}</span>
              <span aria-hidden="true" className="font-medium">
                {typedRole}
                <span className="ml-0.5 inline-block w-[2px] h-5 bg-primary animate-pulse align-middle" />
              </span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-foreground sm:text-2xl"
            >
              {siteContent.tagline}
            </motion.p>

            {/* Summary */}
            <motion.p
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl"
            >
              {siteContent.summary}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={6}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Button asChild size="lg" className="group rounded-full px-6 glow-sm">
                <a href="#projects">
                  View projects
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Button>
              {siteContent.resumeUrl ? (
                <Button asChild variant="secondary" size="lg" className="rounded-full px-6">
                  <a href={siteContent.resumeUrl} target="_blank" rel="noopener noreferrer">
                    Download resume
                    <Download className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <a href="#contact">Let's talk</a>
              </Button>
            </motion.div>

            {/* Social links */}
            <motion.div
              custom={7}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-10 flex flex-wrap items-center gap-2"
            >
              {siteContent.socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border bg-background/60 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
                >
                  <SocialIcon name={s.icon} className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden sm:inline">{s.label}</span>
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Profile Card */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex min-w-0 justify-center lg:justify-end"
          >
            <div className="relative group w-full max-w-[372px]">
              {/* Glow behind card */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/20 via-cyan-400/10 to-fuchsia-400/15 blur-2xl transition-all duration-500 group-hover:from-primary/30 group-hover:blur-3xl"
              />

              {/* Card */}
              <div className="relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl p-3 sm:p-4">
                {/* Gradient border accent */}
                <div className="absolute inset-0 rounded-2xl gradient-border" />

                <div className="overflow-hidden rounded-xl">
                  <img
                    src="/images/arnab-bir-profile.jpg"
                    alt={siteContent.name}
                    width={340}
                    height={340}
                    className="aspect-square w-full object-cover"
                    loading="eager"
                  />
                </div>

                <div className="mt-4 flex items-start justify-between gap-2 px-1">
                  <div>
                    <div className="text-sm font-semibold tracking-tight">{siteContent.role}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {siteContent.location}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-[10px] font-medium text-primary">Available</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Distributed Systems", "Reliability", "Platform Engineering"].map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        aria-hidden="true"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-muted-foreground/50"
      >
        <span className="text-xs tracking-wider uppercase">Scroll</span>
        <motion.div
          animate={reduceMotion ? { y: 0 } : { y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-5 rounded-full border border-current flex items-start justify-center p-1"
        >
          <div className="h-1.5 w-1 rounded-full bg-current" />
        </motion.div>
      </motion.div>
    </section>
  );
}
