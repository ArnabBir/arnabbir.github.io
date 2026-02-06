import React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Mail } from "lucide-react";
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

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Contact"
            title="Want to build something together?"
            description="If you’re hiring, collaborating, or just want to nerd out about distributed systems — I’m happy to chat."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Reach me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="justify-start">
                    <a href={`mailto:${siteContent.email}`}>
                      <Mail className="mr-2 h-4 w-4" /> {siteContent.email}
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
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
                    <Button asChild variant="outline">
                      <a href={siteContent.links.topmate} target="_blank" rel="noopener noreferrer">
                        Book a session <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {siteContent.socials.map((s) => (
                    <Button
                      key={s.href}
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2"
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
                    Mentoring: {" "}
                    {siteContent.links?.preplaced ? (
                      <a
                        className="underline underline-offset-4 hover:text-foreground"
                        href={siteContent.links.preplaced}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preplaced
                      </a>
                    ) : null}
                    {siteContent.links?.preplaced && siteContent.links?.codementor ? " • " : null}
                    {siteContent.links?.codementor ? (
                      <a
                        className="underline underline-offset-4 hover:text-foreground"
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

            <Card>
              <CardHeader>
                <CardTitle>What helps</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                <p>
                  When you reach out, feel free to include: what you’re building, timeline, and what
                  “success” looks like.
                </p>
                <p className="mt-3">
                  If it’s about interviewing/mentoring, sharing your context and goals makes the session
                  far more useful.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
