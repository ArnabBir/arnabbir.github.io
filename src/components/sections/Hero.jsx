import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
    let pauseTimeout;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (text.length + 1 === currentWord.length) {
            pauseTimeout = setTimeout(() => setIsDeleting(true), pauseDuration);
          }
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text.length === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => {
      clearTimeout(timeout);
      clearTimeout(pauseTimeout);
    };
  }, [text, isDeleting, wordIndex, words, reduceMotion, typingSpeed, deletingSpeed, pauseDuration]);

  return text;
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
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const typedRole = useTypingEffect(ROLES, reduceMotion);

  return (
    <section ref={sectionRef} id="home" className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.4] dark:opacity-[0.15] mask-fade-y" />

        {/* Gradient orbs */}
        <motion.div
          style={{ y: y1 }}
          className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/25 via-violet-500/15 to-transparent blur-3xl animate-pulse-glow"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-3xl animate-float-slow"
        />
        <motion.div
          style={{ y: y1 }}
          className="absolute -bottom-40 left-1/3 h-[350px] w-[350px] rounded-full bg-gradient-to-r from-fuchsia-400/15 via-pink-500/10 to-transparent blur-3xl animate-float-reverse"
        />

        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />
      </div>

      <Container className="py-16 sm:py-24 lg:py-28">
        <motion.div style={{ opacity }} className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          {/* Left Column — Text */}
          <div>
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

            {/* Tags */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2 mb-6"
            >
              {["Distributed Systems", "Reliability", "Platform Engineering"].map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                  {tag}
                </Badge>
              ))}
            </motion.div>

            {/* Name */}
            <motion.h1
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
            >
              Hi, I'm{" "}
              <span className="text-shimmer">{siteContent.name}</span>
              <span className="text-primary">.</span>
            </motion.h1>

            {/* Typing role */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-4 flex items-center gap-2 text-lg sm:text-xl text-muted-foreground"
            >
              <Sparkles className="h-5 w-5 text-primary/60" />
              <span className="font-medium">
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
              className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              {siteContent.tagline}
            </motion.p>

            {/* Summary */}
            <motion.p
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-3 text-base text-muted-foreground/80 leading-relaxed max-w-2xl"
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
                  className="group inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur-sm px-3.5 py-2 text-sm text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                >
                  <SocialIcon name={s.icon} className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden sm:inline">{s.label}</span>
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right Column — Profile Card */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex justify-center lg:justify-end"
          >
            <div className="relative group">
              {/* Glow behind card */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/20 via-cyan-400/10 to-fuchsia-400/15 blur-2xl transition-all duration-500 group-hover:from-primary/30 group-hover:blur-3xl"
              />

              {/* Card */}
              <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl p-4 transition-transform duration-500 group-hover:-translate-y-1">
                {/* Gradient border accent */}
                <div className="absolute inset-0 rounded-2xl gradient-border" />

                <div className="overflow-hidden rounded-xl">
                  <img
                    src="/images/arnab-bir-profile.jpg"
                    alt={siteContent.name}
                    className="h-[300px] w-[300px] sm:h-[340px] sm:w-[340px] object-cover transition-transform duration-700 group-hover:scale-105"
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
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-[10px] font-medium text-primary">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
      >
        <span className="text-xs tracking-wider uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-5 rounded-full border border-current flex items-start justify-center p-1"
        >
          <div className="h-1.5 w-1 rounded-full bg-current" />
        </motion.div>
      </motion.div>
    </section>
  );
}
