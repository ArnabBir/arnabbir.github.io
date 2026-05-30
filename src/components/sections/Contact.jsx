import React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Mail, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import SocialIcon from "@/components/icons/SocialIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteContent } from "@/content";

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-20 sm:py-24 relative overflow-hidden">
      {/* Background accent */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-t from-primary/10 via-primary/5 to-transparent blur-3xl" />
      </div>

      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <SectionHeading
            eyebrow="Contact"
            title="Want to build something together?"
            description="Reach out for mentorship, interview prep, or professional opportunities."
            className="mx-auto text-center"
          />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.1 }}
          className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm card-spotlight">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Reach me
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="justify-start rounded-full glow-sm">
                    <a href={`mailto:${siteContent.email}`}>
                      <Mail className="mr-2 h-4 w-4" /> {siteContent.email}
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full"
                    onClick={async () => {
                      const ok = await copyToClipboard(siteContent.email);
                      toast(ok ? "Email copied" : "Could not copy", {
                        description: ok ? siteContent.email : "Your browser blocked clipboard access.",
                      });
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>

                  {siteContent.links?.topmate ? (
                    <Button asChild variant="outline" className="rounded-full group">
                      <a href={siteContent.links.topmate} target="_blank" rel="noopener noreferrer">
                        Book a session
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {siteContent.socials.map((s) => (
                    <Button
                      key={s.href}
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full text-xs transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
                    >
                      <a href={s.href} target="_blank" rel="noopener noreferrer">
                        <SocialIcon name={s.icon} className="h-4 w-4" />
                        {s.label}
                      </a>
                    </Button>
                  ))}
                </div>

                {(siteContent.links?.preplaced || siteContent.links?.codementor) ? (
                  <div className="mt-6 text-sm text-muted-foreground">
                    Mentoring:{" "}
                    {siteContent.links?.preplaced ? (
                      <a
                        className="animated-underline font-medium text-foreground"
                        href={siteContent.links.preplaced}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preplaced
                      </a>
                    ) : null}
                    {siteContent.links?.preplaced && siteContent.links?.codementor ? " · " : null}
                    {siteContent.links?.codementor ? (
                      <a
                        className="animated-underline font-medium text-foreground"
                        href={siteContent.links.codementor}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Codementor
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm card-spotlight">
              <CardHeader>
                <CardTitle className="text-lg">What helps</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>
                  When you reach out, feel free to include: what you're building, timeline, and what
                  "success" looks like.
                </p>
                <p>
                  If it's about interviewing/mentoring, sharing your context and goals makes the session
                  far more useful.
                </p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground/70">
                    I typically respond within 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
